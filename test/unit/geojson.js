'use strict';

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _chai = require('chai');

var _chai2 = _interopRequireDefault(_chai);

var _should = require('should');

var _should2 = _interopRequireDefault(_should);

var _eventStream = require('event-stream');

var es = _interopRequireWildcard(_eventStream);

var _fixture = require('../fixture');

var _libDecodersGeojson = require('../../lib/decoders/geojson');

var _libDecodersGeojson2 = _interopRequireDefault(_libDecodersGeojson);

var expect = _chai2['default'].expect;

describe('geojson decoder', function () {

  it('will emit an error for malformed json', function (onDone) {
    var count = 0;
    (0, _fixture.fixture)('malformed_geojson.json').pipe(new _libDecodersGeojson2['default']()).once('error', function (err) {
      onDone();
    });
  });

  it('geojs can turn simple points to SoQLPoint', function (onDone) {
    var count = 0;
    (0, _fixture.fixture)('simple_points.json').pipe(new _libDecodersGeojson2['default']()).pipe(es.mapSync(function (thing) {
      var columns = thing.columns;
      expect(columns.map(function (c) {
        return c.constructor.name;
      })).to.eql(['SoQLPoint', 'SoQLText', 'SoQLNumber', 'SoQLNumber', 'SoQLBoolean']);
      count++;
    })).on('end', function () {
      expect(count).to.equal(2);
      onDone();
    });
  });

  it('can turn simple points to SoQLLine', function (onDone) {
    (0, _fixture.fixture)('simple_lines.json').pipe(new _libDecodersGeojson2['default']()).pipe(es.mapSync(function (thing) {
      var columns = thing.columns;
      expect(columns.map(function (c) {
        return c.constructor.name;
      })).to.eql(['SoQLLine', 'SoQLText']);
    })).on('end', onDone);
  });

  it('can turn simple points to SoQLPolygon', function (onDone) {
    (0, _fixture.fixture)('simple_polygons.json').pipe(new _libDecodersGeojson2['default']()).pipe(es.mapSync(function (thing) {
      var columns = thing.columns;
      expect(columns.map(function (c) {
        return c.constructor.name;
      })).to.eql(['SoQLPolygon', 'SoQLText']);
    })).on('end', onDone);
  });

  it('can turn simple points to SoQLMultiPoint', function (onDone) {
    var geoJson = (0, _fixture.fixture)('simple_multipoints.json').pipe(new _libDecodersGeojson2['default']()).pipe(es.mapSync(function (thing) {
      var columns = thing.columns;
      expect(columns.map(function (c) {
        return c.constructor.name;
      })).to.eql(['SoQLMultiPoint', 'SoQLText']);
    })).on('end', onDone);
  });

  it('can turn simple points to SoQLMultiLine', function (onDone) {
    (0, _fixture.fixture)('simple_multilines.json').pipe(new _libDecodersGeojson2['default']()).pipe(es.mapSync(function (thing) {
      var columns = thing.columns;
      expect(columns.map(function (c) {
        return c.constructor.name;
      })).to.eql(['SoQLMultiLine', 'SoQLText']);
    })).on('end', onDone);
  });

  it('can turn simple points to SoQLMultiPolygon', function (onDone) {
    (0, _fixture.fixture)('simple_multipolygons.json').pipe(new _libDecodersGeojson2['default']()).pipe(es.mapSync(function (thing) {
      var columns = thing.columns;
      expect(columns.map(function (c) {
        return c.constructor.name;
      })).to.eql(['SoQLMultiPolygon', 'SoQLText']);
    })).on('end', onDone);
  });
});