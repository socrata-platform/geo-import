/**
 * Convert a stream of kml into a stream
 * of SoQLValues.
 *
 *
 */
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }; })();

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _underscore = require('underscore');

var _underscore2 = _interopRequireDefault(_underscore);

var _nodeExpat = require('node-expat');

var _nodeExpat2 = _interopRequireDefault(_nodeExpat);

var _eventStream = require('event-stream');

var _eventStream2 = _interopRequireDefault(_eventStream);

var _stream = require('stream');

var _soqlMapper = require('../soql/mapper');

var _transform2 = require('./transform');

var _config = require('../config');

var _config2 = _interopRequireDefault(_config);

var _through = require('through');

var _through2 = _interopRequireDefault(_through);

//kml has no facilities for name the geometry
var GEOM_NAME = 'the_geom';
//kml is EPSG:4326 and has no facilities for specifying alternate
//formats
var CRS = '+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs';

//all i want is real pattern matching ;_;
//ugliness begins in 3..2..1

var util = {

  pushSchema: function pushSchema(state, spec) {
    var schema = state.schema || [];
    schema.push(spec);
    state.schema = schema;
    return state;
  },

  newFeature: function newFeature() {
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
  setOrCloneFeature: function setOrCloneFeature(state, kind, coordinateMerger) {
    var aFeature = state.features.find(function (feature) {
      return !feature[GEOM_NAME] || feature[GEOM_NAME].type === kind;
    });
    if (aFeature) {
      aFeature[GEOM_NAME] = aFeature[GEOM_NAME] || {};
      aFeature[GEOM_NAME].type = kind;
      aFeature[GEOM_NAME].coordinates = coordinateMerger(aFeature, state);
    } else {
      var clone = _underscore2['default'].clone(state.features[0]);
      clone[GEOM_NAME] = {};
      clone[GEOM_NAME].type = kind;
      clone[GEOM_NAME].coordinates = coordinateMerger(clone, state);
      state.features.push(clone);
    }
    return state;
  },

  mergeSingleGeom: function mergeSingleGeom(_feature, state) {
    return state.coordinates;
  },

  mergeMultiGeom: function mergeMultiGeom(feature, state) {
    var coords = feature[GEOM_NAME].coordinates || [];
    coords.push(state.coordinates);
    return coords;
  },

  'int': [parseInt, 'number'],
  'float': [parseFloat, 'number'],
  'double': [parseFloat, 'number'],
  'boolean': [function (strBool) {
    return strBool.toLowerCase() === 'true';
  }, 'boolean']
};

var coordParse = {
  toSegments: function toSegments(asString) {
    return asString.trim().split('\n');
  },

  //decode 0 levels
  decode0: function decode0(asString) {
    //this will slice off any z coordinate

    var _asString$split$map = asString.split(',').map(parseFloat);

    var _asString$split$map2 = _slicedToArray(_asString$split$map, 2);

    var x = _asString$split$map2[0];
    var y = _asString$split$map2[1];

    return [x, y];
  },

  //decode 1 level
  decode1: function decode1(segments) {
    return _underscore2['default'].flatten(segments.map(function (coords) {
      return coords.trim().split(/\s/).map(coordParse.decode0);
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

  'document.folder': function documentFolder(state, attrs) {
    return [state, []];
  },

  'schema.simplefield': function schemaSimplefield(state, attrs) {
    return [util.pushSchema(state, attrs), []];
  },

  'placemark.extendeddata.schemadata.name': function placemarkExtendeddataSchemadataName(state, attrs) {
    state.attr = 'name';
    return [state, []];
  },

  'placemark.extendeddata.schemadata.description': function placemarkExtendeddataSchemadataDescription(state, attrs) {
    state.attr = 'description';
    return [state, []];
  },

  'placemark.extendeddata.schemadata.simpledata': function placemarkExtendeddataSchemadataSimpledata(state, attrs) {
    state.attr = attrs.name;
    return [state, []];
  }
};

var endElement = {
  'placemark': function placemark(state) {
    return [state, state.features];
  },

  'placemark.extendeddata.schemadata.name': function placemarkExtendeddataSchemadataName(state) {
    state.features = state.features.map(function (feature) {
      feature.name = state.attrValue;
      return feature;
    });
    return [state, []];
  },

  'placemark.extendeddata.schemadata.description': function placemarkExtendeddataSchemadataDescription(state) {
    state.features = state.features.map(function (feature) {
      feature.description = state.attrValue;
      return feature;
    });
    return [state, []];
  },

  'placemark.extendeddata.schemadata.simpledata': function placemarkExtendeddataSchemadataSimpledata(state) {
    state.features = state.features.map(function (feature) {
      feature[state.attr] = state.attrValue;
      return feature;
    });
    return [state, []];
  },

  //geometry
  'point.coordinates': function pointCoordinates(state) {
    state.coordinates = coordParse.decode0(state.attrValue);
    return [state, []];
  },

  'point': function point(state) {
    state = util.setOrCloneFeature(state, 'point', util.mergeSingleGeom);
    return [state, []];
  },

  'multigeometry.point': function multigeometryPoint(state) {
    state = util.setOrCloneFeature(state, 'multipoint', util.mergeMultiGeom);
    state.coordinates = [];
    return [state, []];
  },

  'linestring.coordinates': function linestringCoordinates(state) {
    state.coordinates = coordParse.decode1(coordParse.toSegments(state.attrValue));
    return [state, []];
  },

  'linestring': function linestring(state) {
    state = util.setOrCloneFeature(state, 'linestring', util.mergeSingleGeom);
    return [state, []];
  },

  'multigeometry.linestring': function multigeometryLinestring(state) {
    state = util.setOrCloneFeature(state, 'multilinestring', util.mergeMultiGeom);
    state.coordinates = [];
    return [state, []];
  },

  'polygon.outerboundaryis.*.coordinates': function polygonOuterboundaryisCoordinates(state) {
    state.coordinates.push(coordParse.decode1(coordParse.toSegments(state.attrValue)));
    return [state, []];
  },

  'polygon.innerboundaryis.*.coordinates': function polygonInnerboundaryisCoordinates(state) {
    state.coordinates.push(coordParse.decode1(coordParse.toSegments(state.attrValue)));
    return [state, []];
  },

  'polygon': function polygon(state) {
    state = util.setOrCloneFeature(state, 'polygon', util.mergeSingleGeom);
    state.coordinates = [];
    return [state, []];
  },

  'multigeometry.polygon': function multigeometryPolygon(state) {
    state = util.setOrCloneFeature(state, 'multipolygon', util.mergeMultiGeom);
    state.coordinates = [];
    return [state, []];
  }

};

var KML = (function (_Transform) {
  _inherits(KML, _Transform);

  function KML() {
    var _this = this;

    _classCallCheck(this, KML);

    _get(Object.getPrototypeOf(KML.prototype), 'constructor', this).call(this, {
      objectMode: true,
      highWaterMark: (0, _config2['default'])().rowBufferSize
    });
    this._parser = new _nodeExpat2['default'].Parser("UTF-8");

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

    this._parser.on('error', function (error) {
      _this.emit('error', new Error('XML Parse error: ' + error + ' ' + error.stack));
    });

    events.forEach(function (ev) {
      _this._parser.on(ev, function (name, attrs) {
        //something weird is happening with arguments in () => {}  ;_;

        var _ref = _this['_' + ev](state, name, attrs);

        var _ref2 = _slicedToArray(_ref, 2);

        var newState = _ref2[0];
        var features = _ref2[1];

        if (features.length) {
          var rows = features.map(function (feature) {
            return (0, _transform2.toRow)(feature[GEOM_NAME], _transform2.geomToSoQL, _underscore2['default'].omit(feature, GEOM_NAME), _underscore2['default'].partial(_this._propToSoQL, state.schema).bind(_this), CRS);
          });

          //if all pushes return true, then we should continue reading from the stream
          rows.forEach(_this.push.bind(_this));
          newState.features = _this._newFeatures();
        }
        state = newState;
      });
    });
  }

  _createClass(KML, [{
    key: '_getHandler',
    value: function _getHandler(state, handlers) {
      var at = _underscore2['default'].clone(state.path).reverse();

      var paths = Object.keys(handlers);

      //sort by the number of selectors in the match, so we match more specific things
      //first. this makes it so we can correctly identify multigeometries
      paths.sort(function (a, b) {
        return (a.match(/\./g) || []).length < (b.match(/\./g) || []).length ? 1 : -1;
      });

      return paths.find(function (path) {
        var route = path.split('.').reverse();
        return _underscore2['default'].every(_underscore2['default'].zip(at.slice(0, route.length), route), function (_ref3) {
          var _ref32 = _slicedToArray(_ref3, 2);

          var current = _ref32[0];
          var desired = _ref32[1];

          return desired === '*' || desired === current;
        });
      });
    }
  }, {
    key: '_startElement',
    value: function _startElement(state, name, attrs) {
      state.path.push(name.toLowerCase());

      var matching = this._getHandler(state, startElement);
      if (matching) return startElement[matching](state, attrs);

      return [state, []];
    }
  }, {
    key: '_endElement',
    value: function _endElement(state, name) {
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
  }, {
    key: '_text',
    value: function _text(state, contents) {
      state.attrValue += contents;
      return [state, []];
    }

    //argh
  }, {
    key: '_guessType',
    value: function _guessType(name, value) {
      var guess = parseFloat(value) || parseInt(value);
      if (!_underscore2['default'].isNaN(guess)) return 'number';
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
  }, {
    key: '_propToSoQL',
    value: function _propToSoQL(schema, name, value) {
      var column = schema.find(function (column) {
        return column.name === name;
      });
      var typeName;
      if (column) {
        typeName = column.type;
      } else {
        typeName = this._guessType(name, value);
      }

      var _ref4 = util[typeName] || [false, 'string'];

      var _ref42 = _slicedToArray(_ref4, 2);

      var fn = _ref42[0];
      var soqlCtype = _ref42[1];

      value = fn ? fn(value.trim()) : value.trim();

      return new _soqlMapper.types[soqlCtype](name, value);
    }
  }, {
    key: '_newFeatures',
    value: function _newFeatures() {
      return [util.newFeature()];
    }
  }, {
    key: '_transform',
    value: function _transform(chunk, encoding, done) {
      this._parser.write(chunk);
      done();
    }
  }, {
    key: 'summarize',
    value: function summarize(cb) {
      return cb(false, []);
    }
  }, {
    key: 'canSummarizeQuickly',
    value: function canSummarizeQuickly() {
      return false;
    }
  }], [{
    key: 'canDecode',
    value: function canDecode() {
      return ['application/vnd.google-earth.kml+xml'];
    }
  }]);

  return KML;
})(_stream.Transform);

exports['default'] = KML;
module.exports = exports['default'];
//so name,attrs isn't necessarily an accurate name...