/**
 * this test suite is not for geojson in particular, geojson is just a
 * nice format for the fixtures. this test suite deals with the merger.
 * for geojson-->soql conversion tests, look at the tests/geojson.js suite
 */

'use strict';

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }; })();

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _chai = require('chai');

var _chai2 = _interopRequireDefault(_chai);

var _should = require('should');

var _should2 = _interopRequireDefault(_should);

var _eventStream = require('event-stream');

var es = _interopRequireWildcard(_eventStream);

var _events = require('events');

var _fixture = require('../fixture');

var _through = require('through');

var _through2 = _interopRequireDefault(_through);

var _libDecodersGeojson = require('../../lib/decoders/geojson');

var _libDecodersGeojson2 = _interopRequireDefault(_libDecodersGeojson);

var _libDecodersMerger = require('../../lib/decoders/merger');

var _libDecodersMerger2 = _interopRequireDefault(_libDecodersMerger);

var _libDecodersDisk = require('../../lib/decoders/disk');

var _libDecodersDisk2 = _interopRequireDefault(_libDecodersDisk);

var _libSoqlPoint = require('../../lib/soql/point');

var _libSoqlPoint2 = _interopRequireDefault(_libSoqlPoint);

var _libSoqlLine = require('../../lib/soql/line');

var _libSoqlLine2 = _interopRequireDefault(_libSoqlLine);

var _libSoqlPolygon = require('../../lib/soql/polygon');

var _libSoqlPolygon2 = _interopRequireDefault(_libSoqlPolygon);

var _libSoqlMultipoint = require('../../lib/soql/multipoint');

var _libSoqlMultipoint2 = _interopRequireDefault(_libSoqlMultipoint);

var _libSoqlMultiline = require('../../lib/soql/multiline');

var _libSoqlMultiline2 = _interopRequireDefault(_libSoqlMultiline);

var _libSoqlMultipolygon = require('../../lib/soql/multipolygon');

var _libSoqlMultipolygon2 = _interopRequireDefault(_libSoqlMultipolygon);

var _libSoqlText = require('../../lib/soql/text');

var _libSoqlText2 = _interopRequireDefault(_libSoqlText);

var _libSoqlBoolean = require('../../lib/soql/boolean');

var _libSoqlBoolean2 = _interopRequireDefault(_libSoqlBoolean);

var _libSoqlNumber = require('../../lib/soql/number');

var _libSoqlNumber2 = _interopRequireDefault(_libSoqlNumber);

var _libSoqlArray = require('../../lib/soql/array');

var _libSoqlArray2 = _interopRequireDefault(_libSoqlArray);

var expect = _chai2['default'].expect;

function makeMerger() {
  var res = new _events.EventEmitter();
  return [new _libDecodersMerger2['default'](new _libDecodersDisk2['default'](res), []), res];
}

function jsbuf() {
  var s = '';
  return (0, _through2['default'])(function write(data) {
    s += data.toString('utf-8');
  }, function end() {
    this.emit('end', JSON.parse(s));
  });
}

describe('merging feature streams to layers', function () {

  it('will handle homogenous points, default crs', function (onDone) {
    var _makeMerger = makeMerger();

    var _makeMerger2 = _slicedToArray(_makeMerger, 2);

    var merger = _makeMerger2[0];
    var response = _makeMerger2[1];

    (0, _fixture.fixture)('simple_points.json').pipe(new _libDecodersGeojson2['default']()).pipe(merger).on('end', function (layers) {
      response.emit('finish');
      expect(layers.length).to.equal(1);

      var _layers = _slicedToArray(layers, 1);

      var layer = _layers[0];

      expect(layer.columns.map(function (c) {
        return [c.name, c.ctype];
      })).to.eql([['the_geom', 'point'], ['a_string', 'string'], ['a_num', 'number'], ['a_float', 'number'], ['a_bool', 'boolean']]);

      layer.pipe(jsbuf()).on('end', function (jsRow) {
        expect(jsRow).to.eql([{
          "the_geom": {
            "type": "Point",
            "coordinates": [102, 0.5]
          },
          "a_string": "first value",
          "a_num": 2,
          "a_float": 2.2,
          "a_bool": false
        }, {
          "the_geom": {
            "type": "Point",
            "coordinates": [103, 1.5]
          },
          "a_string": "second value",
          "a_num": 2,
          "a_float": 2.2,
          "a_bool": true
        }]);

        onDone();
      });
    });
  });

  it('will handle homogenous points, heterogenous non wgs84 crs', function (onDone) {
    var _makeMerger3 = makeMerger();

    var _makeMerger32 = _slicedToArray(_makeMerger3, 2);

    var merger = _makeMerger32[0];
    var response = _makeMerger32[1];

    (0, _fixture.fixture)('multi_non_wgs84.json').pipe(new _libDecodersGeojson2['default']()).pipe(merger).on('end', function (layers) {

      expect(layers.length).to.equal(1);

      var _layers2 = _slicedToArray(layers, 1);

      var layer = _layers2[0];

      expect(layer.columns.map(function (c) {
        return [c.name, c.ctype];
      })).to.eql([['the_geom', 'point'], ['a_string', 'string'], ['a_num', 'number'], ['a_float', 'number'], ['a_bool', 'boolean']]);

      layer.pipe(jsbuf()).on('end', function (jsRow) {
        expect(jsRow).to.eql([{
          "the_geom": {
            "type": "Point",
            "coordinates": [-97.48783007891072, 0.000004509692825832316]
          },
          "a_string": "first value",
          "a_num": 2,
          "a_float": 2.2,
          "a_bool": false
        }, {
          "the_geom": {
            "type": "Point",
            "coordinates": [10.788967390468883, 45.03596703206463]
          },
          "a_string": "second value",
          "a_num": 2,
          "a_float": 2.2,
          "a_bool": true
        }]);
        onDone();
      });
    });
  });

  it('will handle homogenous points, heterogenous crs', function (onDone) {
    var _makeMerger4 = makeMerger();

    var _makeMerger42 = _slicedToArray(_makeMerger4, 2);

    var merger = _makeMerger42[0];
    var response = _makeMerger42[1];

    (0, _fixture.fixture)('multi_crs.json').pipe(new _libDecodersGeojson2['default']()).pipe(merger).on('end', function (layers) {

      expect(layers.length).to.equal(1);

      var _layers3 = _slicedToArray(layers, 1);

      var layer = _layers3[0];

      expect(layer.columns.map(function (c) {
        return [c.name, c.ctype];
      })).to.eql([['the_geom', 'point'], ['a_string', 'string'], ['a_num', 'number'], ['a_float', 'number'], ['a_bool', 'boolean']]);

      layer.pipe(jsbuf()).on('end', function (jsRow) {
        expect(jsRow).to.eql([{
          "the_geom": {
            "type": "Point",
            "coordinates": [-97.48783007891072, 0.000004509692825832316]
          },
          "a_string": "first value",
          "a_num": 2,
          "a_float": 2.2,
          "a_bool": false
        }, {
          "the_geom": {
            "type": "Point",
            "coordinates": [103, 1.5]
          },
          "a_string": "second value",
          "a_num": 2,
          "a_float": 2.2,
          "a_bool": true
        }]);
        onDone();
      });
    });
  });

  it('will handle homogenous lines, heterogenous crs', function (onDone) {
    var _makeMerger5 = makeMerger();

    var _makeMerger52 = _slicedToArray(_makeMerger5, 2);

    var merger = _makeMerger52[0];
    var response = _makeMerger52[1];

    (0, _fixture.fixture)('simple_lines.json').pipe(new _libDecodersGeojson2['default']()).pipe(merger).on('end', function (layers) {
      response.emit('finish');
      expect(layers.length).to.equal(1);

      var _layers4 = _slicedToArray(layers, 1);

      var layer = _layers4[0];

      expect(layer.columns.map(function (c) {
        return [c.name, c.ctype];
      })).to.eql([['the_geom', 'linestring'], ['a_string', 'string']]);

      layer.pipe(jsbuf()).on('end', function (jsRow) {
        expect(jsRow).to.eql([{
          "the_geom": {
            "type": "LineString",
            "coordinates": [[-97.48784799692679, 0], [-97.48783903791886, 0.000009019385540221545]]
          },
          "a_string": "first value"
        }, {
          "the_geom": {
            "type": "LineString",
            "coordinates": [[101, 0], [101, 1]]
          },
          "a_string": "second value"
        }]);
        onDone();
      });
    });
  });

  it('will handle homogenous polygons, heterogenous crs', function (onDone) {
    var _makeMerger6 = makeMerger();

    var _makeMerger62 = _slicedToArray(_makeMerger6, 2);

    var merger = _makeMerger62[0];
    var response = _makeMerger62[1];

    (0, _fixture.fixture)('simple_polygons.json').pipe(new _libDecodersGeojson2['default']()).pipe(merger).on('end', function (layers) {
      response.emit('finish');
      expect(layers.length).to.equal(1);

      var _layers5 = _slicedToArray(layers, 1);

      var layer = _layers5[0];

      expect(layer.columns.map(function (c) {
        return [c.name, c.ctype];
      })).to.eql([['the_geom', 'polygon'], ['a_string', 'string']]);

      layer.pipe(jsbuf()).on('end', function (jsRow) {
        expect(jsRow).to.eql([{
          "the_geom": {
            "type": "Polygon",
            "coordinates": [[[-97.48784799692679, 0], [-97.4878390379188, 0], [-97.48783903791886, 0.000009019385540221545], [-97.48784799692685, 0.000009019385428778238], [-97.48784799692679, 0]], [[-97.48784620512521, 0.0000018038770902133842], [-97.48784082972041, 0.000001803877103586581], [-97.48784082972045, 0.000007215508414346324], [-97.48784620512522, 0.000007215508360853537], [-97.48784620512521, 0.0000018038770902133842]]]
          },
          "a_string": "first value"
        }, {
          "the_geom": {
            "type": "Polygon",
            "coordinates": [[[100, 0], [101, 0], [101, 1], [100, 1], [100, 0]], [[100.2, 0.2], [100.8, 0.2], [100.8, 0.8], [100.2, 0.8], [100.2, 0.2]]]
          },
          "a_string": "second value"
        }]);
        onDone();
      });
    });
  });

  it('will handle homogenous multipoints, heterogenous crs', function (onDone) {
    var _makeMerger7 = makeMerger();

    var _makeMerger72 = _slicedToArray(_makeMerger7, 2);

    var merger = _makeMerger72[0];
    var response = _makeMerger72[1];

    (0, _fixture.fixture)('simple_multipoints.json').pipe(new _libDecodersGeojson2['default']()).pipe(merger).on('end', function (layers) {
      response.emit('finish');
      expect(layers.length).to.equal(1);

      var _layers6 = _slicedToArray(layers, 1);

      var layer = _layers6[0];

      expect(layer.columns.map(function (c) {
        return [c.name, c.ctype];
      })).to.eql([['the_geom', 'multipoint'], ['a_string', 'string']]);

      layer.pipe(jsbuf()).on('end', function (jsRow) {

        expect(jsRow).to.eql([{
          "the_geom": {
            "type": "MultiPoint",
            "coordinates": [[-97.48784799692679, 0], [-97.48783903791886, 0.000009019385540221545]]
          },
          "a_string": "first value"
        }, {
          "the_geom": {
            "type": "MultiPoint",
            "coordinates": [[101, 0], [101, 1]]
          },
          "a_string": "second value"
        }]);
        onDone();
      });
    });
  });

  it('will handle homogenous multilines, heterogenous crs', function (onDone) {
    var _makeMerger8 = makeMerger();

    var _makeMerger82 = _slicedToArray(_makeMerger8, 2);

    var merger = _makeMerger82[0];
    var response = _makeMerger82[1];

    (0, _fixture.fixture)('simple_multilines.json').pipe(new _libDecodersGeojson2['default']()).pipe(merger).on('end', function (layers) {
      response.emit('finish');
      expect(layers.length).to.equal(1);

      var _layers7 = _slicedToArray(layers, 1);

      var layer = _layers7[0];

      expect(layer.columns.map(function (c) {
        return [c.name, c.ctype];
      })).to.eql([['the_geom', 'multilinestring'], ['a_string', 'string']]);

      layer.pipe(jsbuf()).on('end', function (jsRow) {
        expect(jsRow).to.eql([{
          "the_geom": {
            "type": "MultiLineString",
            "coordinates": [[[-97.48784799692679, 0], [-97.48783903791886, 0.000009019385540221545]], [[-97.48783007891092, 0.000018038771303329256], [-97.48782111990299, 0.000027058157289322467]]]
          },
          "a_string": "first value"
        }, {
          "the_geom": {
            "type": "MultiLineString",
            "coordinates": [[[101, 0], [102, 1]], [[102, 2], [103, 3]]]
          },
          "a_string": "second value"
        }]);
        onDone();
      });
    });
  });

  it('will handle homogenous multipolygons, heterogenous crs', function (onDone) {
    var _makeMerger9 = makeMerger();

    var _makeMerger92 = _slicedToArray(_makeMerger9, 2);

    var merger = _makeMerger92[0];
    var response = _makeMerger92[1];

    (0, _fixture.fixture)('simple_multipolygons.json').pipe(new _libDecodersGeojson2['default']()).pipe(merger).on('end', function (layers) {
      response.emit('finish');
      expect(layers.length).to.equal(1);

      var _layers8 = _slicedToArray(layers, 1);

      var layer = _layers8[0];

      expect(layer.columns.map(function (c) {
        return [c.name, c.ctype];
      })).to.eql([['the_geom', 'multipolygon'], ['a_string', 'string']]);

      var features = [];
      layer.pipe(jsbuf()).on('end', function (jsRow) {
        expect(jsRow).to.eql([{
          "the_geom": {
            "type": "MultiPolygon",
            "coordinates": [[[[-97.48783007891092, 0.000018038771303329256], [-97.48782111990273, 0.00001803877152621498], [-97.48782111990299, 0.000027058157289322467], [-97.4878300789112, 0.00002705815695499387], [-97.48783007891092, 0.000018038771303329256]]], [[[-97.48784799692679, 0], [-97.4878390379188, 0], [-97.48783903791886, 0.000009019385540221545], [-97.48784799692685, 0.000009019385428778238], [-97.48784799692679, 0]], [[-97.48784620512521, 0.0000018038770902133842], [-97.48784082972041, 0.000001803877103586581], [-97.48784082972045, 0.000007215508414346324], [-97.48784620512522, 0.000007215508360853537], [-97.48784620512521, 0.0000018038770902133842]]]]
          },
          "a_string": "first value"
        }, {
          "the_geom": {
            "type": "MultiPolygon",
            "coordinates": [[[[103, 2], [102, 2], [103, 3], [102, 3], [103, 2]]], [[[100, 0], [101, 0], [101, 1], [100, 1], [100, 0]], [[100.2, 0.2], [100.8, 0.2], [100.8, 0.8], [100.2, 0.8], [100.2, 0.2]]]]
          },
          "a_string": "second value"
        }]);

        onDone();
      });
    });
  });
});