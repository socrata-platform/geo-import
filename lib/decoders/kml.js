/**
 * Convert a stream of kml into a stream
 * of SoQLValues.
 *
 *
 */
import _ from 'underscore';
import expat from 'node-expat';
import es from 'event-stream';
import {
  Transform
}
from 'stream';
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
//kml is EPSG:4326 and has no facilities for specifying alternate
//formats
const CRS = '+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs';

//all i want is real pattern matching ;_;
//ugliness begins in 3..2..1

var util = {

  pushSchema: (state, spec) => {
    let schema = state.schema || [];
    schema.push(spec);
    state.schema = schema;
    return state;
  },

  newFeature: () => {
    return {};
  },


  /**
   * So this is kind of weird:
   * KML allows heterogenous geometries..
   *   * not only within a file
   *   * not only within a folder
   *   * but also within a MultiGeometry tag!
   *
   * So this means that if we're in a Placemark.*.MultiGeometry tag,
   * we need to be able to emit new N features into the feature stream,
   * not just one.
   *
   * This is why all the event handlers need to return the state
   * and an *array* of all geometries geometries, to be emitted into
   * the feature stream, and not just a single geometry, because
   * a placemark doesn't map 1:1 onto Socrata rows within a dataset
   *
   * So if we're in a MultiGeometry tag, and we see 2 points, like this:
   * <MultiGeometry>
   *   <Point>...</Point>
   *   <Point>...</Point>
   * </MultiGeometry>
   *
   * then when we encounter the 2nd point,
   * we already have a feature in state.features that matches this type,
   * so it gets appended as a point within a multipoint type object
   *
   * If we're in a MultiGeometry tag, and we see a line and point like this:
   * <MultiGeometry>
   *   <Point>...</Point>
   *   <Line>...</Line>
   * </MultiGeometry>
   *
   * Then when we encounter the line, it won't match any existing feature
   * in the state.features list, so we clone the properties from an
   * existing feature and build the coordinates for it, and then
   * add it to the state.features list
   *
   * Recap:
   *   * We have a schema, which just a suggestion of what type things might be
   *   * We have folders, which is just a suggestion of logical groupings
   *   * We have MultiGeometry, which is just a suggestion of shape groups
   *
   * So KML is the  ¯\_(ツ)_/¯ of geo formats
   */
  setOrCloneFeature: (state, kind, coordinateMerger) => {
    var aFeature = state.features.find((feature) => {
      return !feature[GEOM_NAME] || (feature[GEOM_NAME].type === kind);
    });
    if (aFeature) {
      aFeature[GEOM_NAME] = aFeature[GEOM_NAME] || {};
      aFeature[GEOM_NAME].type = kind;
      aFeature[GEOM_NAME].coordinates = coordinateMerger(aFeature, state);
    } else {
      let clone = _.clone(state.features[0]);
      clone[GEOM_NAME] = {};
      clone[GEOM_NAME].type = kind;
      clone[GEOM_NAME].coordinates = coordinateMerger(clone, state);
      state.features.push(clone);
    }
    return state;
  },

  mergeSingleGeom: (_feature, state) => {
    return state.coordinates;
  },

  mergeMultiGeom: (feature, state) => {
    var coords = (feature[GEOM_NAME].coordinates || []);
    coords.push(state.coordinates);
    return coords;
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
    return [state, []];
  },

  'schema.simplefield': (state, attrs) => {
    return [util.pushSchema(state, attrs), []];
  },

  'placemark.extendeddata.schemadata.name': (state, attrs) => {
    state.attr = 'name';
    return [state, []];
  },

  'placemark.extendeddata.schemadata.description': (state, attrs) => {
    state.attr = 'description';
    return [state, []];
  },

  'placemark.extendeddata.schemadata.simpledata': (state, attrs) => {
    state.attr = attrs.name;
    return [state, []];
  }
};


var endElement = {
  'placemark': (state) => {
    return [state, state.features];
  },

  'placemark.extendeddata.schemadata.name': (state) => {
    state.features = state.features.map((feature) => {
      feature.name = state.attrValue;
      return feature;
    });
    return [state, []];
  },

  'placemark.extendeddata.schemadata.description': (state) => {
    state.features = state.features.map((feature) => {
      feature.description = state.attrValue;
      return feature;
    });
    return [state, []];
  },

  'placemark.extendeddata.schemadata.simpledata': (state) => {
    state.features = state.features.map((feature) => {
      feature[state.attr] = state.attrValue;
      return feature;
    });
    return [state, []];
  },


  //geometry
  'point.coordinates': (state) => {
    state.coordinates = coordParse.decode0(state.attrValue);
    return [state, []];
  },

  'point': (state) => {
    state = util.setOrCloneFeature(state, 'point', util.mergeSingleGeom);
    return [state, []];
  },

  'multigeometry.point': (state) => {
    state = util.setOrCloneFeature(state, 'multipoint', util.mergeMultiGeom);
    state.coordinates = [];
    return [state, []];
  },

  'linestring.coordinates': (state) => {
    state.coordinates = coordParse.decode1(coordParse.toSegments(state.attrValue));
    return [state, []];
  },

  'linestring': (state) => {
    state = util.setOrCloneFeature(state, 'linestring', util.mergeSingleGeom);
    return [state, []];
  },

  'multigeometry.linestring': (state) => {
    state = util.setOrCloneFeature(state, 'multilinestring', util.mergeMultiGeom);
    state.coordinates = [];
    return [state, []];
  },

  'polygon.outerboundaryis.*.coordinates': (state) => {
    state.coordinates.push(coordParse.decode1(coordParse.toSegments(state.attrValue)));
    return [state, []];
  },

  'polygon.innerboundaryis.*.coordinates': (state) => {
    state.coordinates.push(coordParse.decode1(coordParse.toSegments(state.attrValue)));
    return [state, []];
  },

  'polygon': (state) => {
    state = util.setOrCloneFeature(state, 'polygon', util.mergeSingleGeom);
    state.coordinates = [];
    return [state, []];
  },

  'multigeometry.polygon': (state) => {
    state = util.setOrCloneFeature(state, 'multipolygon', util.mergeMultiGeom);
    state.coordinates = [];
    return [state, []];
  }

};



class KML extends Transform {

  constructor() {
    super({
      objectMode: true
    });
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
      features: this._newFeatures()
    };

    this._parser.on('error', (error) => {
      this.emit('error', new Error(`XML Parse error: ${error.stack}`));
    });

    events.forEach((ev) => {
      this._parser.on(ev, (name, attrs) => {
        //something weird is happening with arguments in () => {}  ;_;
        //so name,attrs isn't necessarily an accurate name...
        var [newState, features] = this['_' + ev](state, name, attrs);

        if (features.length) {
          let rows = features.map((feature) => {
            return toRow(
              feature[GEOM_NAME], geomToSoQL, _.omit(feature, GEOM_NAME),
              _.partial(this._propToSoQL, state.schema).bind(this),
              CRS
            );
          });

          rows.forEach(this.push.bind(this));

          newState.features = this._newFeatures();
        }
        state = newState;
      });
    });

  }

  static canDecode() {
    return ['application/vnd.google-earth.kml+xml'];
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

    return [state, []];
  }

  _endElement(state, name) {
    var matching = this._getHandler(state, endElement);

    //ugh
    var result = [state, []];
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
    return [state, []];
  }

  //argh
  _guessType(name, value) {
    var guess = parseFloat(value) || parseInt(value);
    if (!_.isNaN(guess)) return 'number';
    return 'string';
  }

  /**
   * The gods who bestowed the majestic KML specification
   * upon us mere mortals decided that it would be a reasonable
   * idea to make the Schema declaration optional. So now in
   * addition to casting strings into their actual types when
   * the user supplies a schema, we also need to guess at the
   * types when they don't.
   *
   * hypothesis: pretty much anything is valid KML
   *
   */
  _propToSoQL(schema, name, value) {
    var column = schema.find((column) => column.name === name);
    var typeName;
    if (column) {
      typeName = column.type;
    } else {
      typeName = this._guessType(name, value);
    }

    var [fn, soqlCtype] = (util[typeName] || [false, 'string']);
    value = fn ? fn(value.trim()) : value.trim();

    return new types[soqlCtype](name, value);
  }

  _newFeatures() {
    return [util.newFeature()];
  }

  _transform(chunk, encoding, done) {
    this._parser.write(chunk);
    done();

  }

  summarize(cb) {
    return cb(false, []);
  }

  canSummarizeQuickly() {
    return false;
  }
}

export default KML;