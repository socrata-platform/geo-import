/**
 * Convert a stream of kml into a stream
 * of SoQLValues.
 *
 *
 */
import _ from 'underscore';
import expat from 'node-expat';
import es from 'event-stream';
import {Transform} from 'stream';
import {
  types
}
from '../soql/mapper';
import {
  toRow, geomToSoQL, propToSoQL
}
from './transform';
import through from 'through';


//kml has no facilities for name the geometry
const GEOM_NAME = 'the_geom';
const CRS = '+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +no_defs';

//all i want is real pattern matching ;_;
//ugliness begins in 3..2..1

var util = {

  pushSchema: (state, spec) => {
    let schema = state.schema || [];
    schema.push(spec);
    state.schema = schema;
    return state;
  },


  'int': [parseInt, 'number'],
  'float': [parseFloat, 'number'],
  'double': [parseFloat, 'number'],
  'boolean': [(strBool) => {
    return strBool.toLowerCase() === 'true';
  }, 'boolean']
};


var coordParse = {
  toSegments: (asString) => {
    return asString.trim().split('\n');
  },

  //decode 0 levels
  decode0: (asString) => {
    //this will slice off any z coordinate
    var [x, y] = asString.split(',').map(parseFloat);
    return [x, y];
  },

  //decode 1 level
  decode1: (segments) => {
    return _.flatten(segments.map((coords) => {
      return coords.split(/\s/).map(coordParse.decode0);
    }), true);
  }
};

/**
 * startElement and endElement handlers.
 * every function in here can either update the parser state, return a new feature
 * to push onto the stream, or both. Every function needs to return a 2 element
 * array with [state, feature]
 */

var startElement = {

  'document.folder': (state, attrs) => {
    return [state, false];
  },

  'schema.simplefield': (state, attrs) => {
    return [util.pushSchema(state, attrs), false];
  },

  'placemark.name': (state, attrs) => {
    state.attr = 'name';
    return [state, false];
  },

  'placemark.description': (state, attrs) => {
    state.attr = 'description';
    return [state, false];
  },

  'placemark.extendeddata.schemadata.simpledata': (state, attrs) => {
    state.attr = attrs.name;
    return [state, false];
  }
};


var endElement = {
  'placemark': (state) => {
    let f = state.feature;
    return [state, f];
  },

  'placemark.extendeddata.schemadata.simpledata': (state) => {
    state.feature[state.attr] = state.attrValue;
    return [state, false];
  },


  //geometry
  'point.coordinates': (state) => {
    state.coordinates = coordParse.decode0(state.attrValue);
    return [state, false];
  },

  'point': (state) => {
    state.feature[GEOM_NAME].type = 'point';
    state.feature[GEOM_NAME].coordinates = state.coordinates;
    return [state, false];
  },

  'multigeometry.point': (state) => {
    state.feature[GEOM_NAME].type = 'multipoint';
    state.feature[GEOM_NAME].coordinates.push(state.coordinates);
    return [state, false];
  },


  'linestring.coordinates': (state) => {
    state.coordinates = coordParse.decode1(coordParse.toSegments(state.attrValue));
    return [state, false];
  },

  'linestring':(state) => {
    state.feature[GEOM_NAME].type = 'linestring';
    state.feature[GEOM_NAME].coordinates = state.coordinates;
    return [state, false];
  },

  'multigeometry.linestring':(state) => {
    state.feature[GEOM_NAME].type = 'multilinestring';
    state.feature[GEOM_NAME].coordinates.push(state.coordinates);
    return [state, false];
  },


  'polygon.outerboundaryis.*.coordinates': (state) => {
    state.coordinates.push(coordParse.decode1(coordParse.toSegments(state.attrValue)));
    return [state, false];
  },

  'polygon.innerboundaryis.*.coordinates': (state) => {
    state.coordinates.push(coordParse.decode1(coordParse.toSegments(state.attrValue)));
    return [state, false];
  },

  'polygon':(state) => {
    state.feature[GEOM_NAME].type = 'polygon';
    state.feature[GEOM_NAME].coordinates = state.coordinates;
    state.coordinates = [];
    return [state, false];
  },

  'multigeometry.polygon':(state) => {
    state.feature[GEOM_NAME].type = 'multipolygon';
    state.feature[GEOM_NAME].coordinates.push(state.coordinates);
    state.coordinates = [];
    return [state, false];
  }

};



class KML extends Transform {

  constructor() {
    super({objectMode: true});
    this._parser = new expat.Parser("UTF-8");
    var out = through((chunk) => {}, () => out.queue(null));

    var events = ['startElement', 'endElement', 'text'];

    //this mutates
    var state = {
      path: [],
      schema: [],
      attr: '',
      attrValue: '',
      coordinates: [],
      feature: this._newFeature()
    };

    this._parser.on('error', (error) => {
      this.emit('error', new Error(`XML Parse error: ${error.toString()}`));
    });

    events.forEach((ev) => {
      this._parser.on(ev, (name, attrs) => {
        //something weird is happening with arguments in () => {}  ;_;
        //so name,attrs isn't necessarily an accurate name...
        var [newState, feature] = this['_' + ev](state, name, attrs);

        if (feature) {
          let row = toRow(
            feature[GEOM_NAME], geomToSoQL, _.omit(feature, GEOM_NAME),
            _.partial(this._propToSoQL, state.schema),
            CRS
          );
          this.push(row);
          newState.feature = this._newFeature();
        }
        state = newState;
      }.bind(this));
    }.bind(this));
  }

  _getHandler(state, handlers) {
    var at = _.clone(state.path).reverse();

    var paths = Object.keys(handlers);

    //sort by the number of selectors in the match, so we match more specific things
    //first. this makes it so we can correctly identify multigeometries
    paths.sort((a, b) => (a.match(/\./g) || []).length < (b.match(/\./g) || []).length ? 1 : -1);

    return paths.find((path) => {
      var route = path.split('.').reverse();
      return _.every(_.zip(at.slice(0, route.length), route), ([current, desired]) => {
        return (desired === '*') || (desired === current);
      });
    });
  }

  _startElement(state, name, attrs) {
    state.path.push(name.toLowerCase());

    var matching = this._getHandler(state, startElement);
    if (matching) return startElement[matching](state, attrs);

    return [state, false];
  }

  _endElement(state, name) {
    var matching = this._getHandler(state, endElement);

    //ugh
    var result = [state, false];
    if (matching) {
      result = endElement[matching](state, name);
    }

    state.attr = '';
    state.attrValue = '';

    state.path.pop();

    return result;
  }

  _text(state, contents) {
    state.attrValue += contents;
    return [state, false];
  }

  _propToSoQL(schema, name, value) {
    var typeName = schema.find((column) => column.name === name).type;

    var [fn, soqlCtype] = (util[typeName] || [false, 'string']);
    value = fn ? fn(value.trim()) : value.trim();

    return new types[soqlCtype](name, value);
  }

  _newFeature() {
    var f = {};
    f[GEOM_NAME] = {
      coordinates: []
    };
    return f;
  }

  _transform(chunk, encoding, done) {
    this._parser.write(chunk);
    done();

  }
}

export default KML;
