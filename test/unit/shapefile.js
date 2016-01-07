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

var _fixture = require('../fixture');

var _libDecodersShapefile = require('../../lib/decoders/shapefile');

var _libDecodersShapefile2 = _interopRequireDefault(_libDecodersShapefile);

var _nodeSrs = require('node-srs');

var _nodeSrs2 = _interopRequireDefault(_nodeSrs);

var _libDecodersDisk = require('../../lib/decoders/disk');

var _libDecodersDisk2 = _interopRequireDefault(_libDecodersDisk);

var _events = require('events');

var expect = _chai2['default'].expect;
var res;

function shpDecoder() {
  res = new _events.EventEmitter();
  return [new _libDecodersShapefile2['default'](new _libDecodersDisk2['default'](res)), res];
}

describe('shapefile decoder', function () {

  afterEach(function () {
    res.emit('finish');
  });

  it('will emit an error for a corrupt shapefile', function (onDone) {
    var count = 0;

    var _shpDecoder = shpDecoder();

    var _shpDecoder2 = _slicedToArray(_shpDecoder, 2);

    var decoder = _shpDecoder2[0];
    var res = _shpDecoder2[1];

    (0, _fixture.fixture)('corrupt_shapefile.zip').pipe(decoder).on('error', function (err) {
      expect(err.toString()).to.contain("Failed to read feature");
      onDone();
    }).pipe(es.mapSync(function () {}));
  });

  it('correctly reads .prj file for non epsg4326 features and populates the geojson feature with it', function (onDone) {
    var _shpDecoder3 = shpDecoder();

    var _shpDecoder32 = _slicedToArray(_shpDecoder3, 2);

    var decoder = _shpDecoder32[0];
    var res = _shpDecoder32[1];

    (0, _fixture.fixture)('simple_points_epsg_2834.zip').pipe(decoder).pipe(es.mapSync(function (feature) {
      var parsedCrs = _nodeSrs2['default'].parse(feature.crs);
      expect(parsedCrs.valid).to.equal(true);
      expect(parsedCrs.proj4).to.equal("+proj=lcc +lat_1=41.7 +lat_2=40.43333333333333 +lat_0=39.66666666666666 +lon_0=-82.5 +x_0=600000 +y_0=0 +ellps=GRS80 +units=m +no_defs");
    })).on('end', onDone);
  });

  it('defaults to default projection when prj is not there', function (onDone) {
    var _shpDecoder4 = shpDecoder();

    var _shpDecoder42 = _slicedToArray(_shpDecoder4, 2);

    var decoder = _shpDecoder42[0];
    var res = _shpDecoder42[1];

    (0, _fixture.fixture)('simple_points_sans_prj.zip').pipe(decoder).pipe(es.mapSync(function (feature) {
      var parsedCrs = _nodeSrs2['default'].parse(feature.crs);
      expect(parsedCrs.valid).to.equal(true);
      expect(parsedCrs.proj4).to.equal("+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs");
    })).on('end', onDone);
  });

  it('can deal with dates in a shapefile', function (onDone) {
    var _shpDecoder5 = shpDecoder();

    var _shpDecoder52 = _slicedToArray(_shpDecoder5, 2);

    var decoder = _shpDecoder52[0];
    var res = _shpDecoder52[1];

    (0, _fixture.fixture)('dates.zip').pipe(decoder).pipe(es.mapSync(function (feature) {
      var _feature$columns$filter = feature.columns.filter(function (c) {
        return c.name === 'gps_date' || c.name === 'date';
      });

      var _feature$columns$filter2 = _slicedToArray(_feature$columns$filter, 2);

      var date = _feature$columns$filter2[0];
      var gpsDate = _feature$columns$filter2[1];

      //just check that the date is ISO8601 parsable
      expect(Date.parse(date.value).toString()).to.not.equal('Invalid Date');
      expect(Date.parse(gpsDate.value).toString()).to.not.equal('Invalid Date');
    })).on('end', onDone);
  });

  it('can turn simple points to SoQLPoint', function (onDone) {
    var expectedValues = [[{
      "type": "Point",
      "coordinates": [102.0, 0.5]
    }, "first value", 2, 2.2, 0], [{
      "type": "Point",
      "coordinates": [103.0, 1.5]
    }, "second value", 2, 2.2, 1]];

    var count = 0;

    var _shpDecoder6 = shpDecoder();

    var _shpDecoder62 = _slicedToArray(_shpDecoder6, 2);

    var decoder = _shpDecoder62[0];
    var res = _shpDecoder62[1];

    (0, _fixture.fixture)('simple_points.zip').pipe(decoder).pipe(es.mapSync(function (thing) {
      var columns = thing.columns;
      expect(columns.map(function (c) {
        return c.constructor.name;
      })).to.eql(['SoQLPoint', 'SoQLText', 'SoQLNumber', 'SoQLNumber', 'SoQLNumber']);
      expect(columns.map(function (c) {
        return c.value;
      })).to.eql(expectedValues[count]);
      count++;
    })).on('end', function () {
      expect(count).to.equal(2);
      onDone();
    });
  });

  it('can turn simple lines to SoQLLine', function (onDone) {
    var expectedValues = [[{
      "type": "LineString",
      "coordinates": [[100.0, 0.0], [101.0, 1.0]]
    }, "first value"], [{
      "type": "LineString",
      "coordinates": [[101.0, 0.0], [101.0, 1.0]]
    }, "second value"]];
    var count = 0;

    var _shpDecoder7 = shpDecoder();

    var _shpDecoder72 = _slicedToArray(_shpDecoder7, 2);

    var decoder = _shpDecoder72[0];
    var res = _shpDecoder72[1];

    (0, _fixture.fixture)('simple_lines.zip').pipe(decoder).pipe(es.mapSync(function (thing) {

      var columns = thing.columns;
      expect(columns.map(function (c) {
        return c.constructor.name;
      })).to.eql(['SoQLLine', 'SoQLText']);
      expect(columns.map(function (c) {
        return c.value;
      })).to.eql(expectedValues[count]);
      count++;
    })).on('end', onDone);
  });

  it('can turn simple polys to SoQLPolygon', function (onDone) {
    var expectedValues = [[{
      "type": "MultiPolygon",
      "coordinates": [[[[100, 0], [100, 1], [101, 1], [101, 0], [100, 0]], [[100.2, 0.2], [100.8, 0.2], [100.8, 0.8], [100.2, 0.8], [100.2, 0.2]]]]
    }, "first value"], [{
      "type": "MultiPolygon",
      "coordinates": [[[[100, 0], [100, 1], [101, 1], [101, 0], [100, 0]], [[100.2, 0.2], [100.8, 0.2], [100.8, 0.8], [100.2, 0.8], [100.2, 0.2]]]]
    }, "second value"]];
    var count = 0;

    var _shpDecoder8 = shpDecoder();

    var _shpDecoder82 = _slicedToArray(_shpDecoder8, 2);

    var decoder = _shpDecoder82[0];
    var res = _shpDecoder82[1];

    (0, _fixture.fixture)('simple_polygons.zip').pipe(decoder).pipe(es.mapSync(function (thing) {
      var columns = thing.columns;
      expect(columns.map(function (c) {
        return c.constructor.name;
      })).to.eql(['SoQLMultiPolygon', 'SoQLText']);
      expect(columns.map(function (c) {
        return c.value;
      })).to.eql(expectedValues[count]);
      count++;
    })).on('end', onDone);
  });

  it('can turn simple multipoints to SoQLMultiPoint', function (onDone) {
    var expectedValues = [[{
      "type": "MultiPoint",
      "coordinates": [[100.0, 0.0], [101.0, 1.0]]
    }, "first value"], [{
      "type": "MultiPoint",
      "coordinates": [[101.0, 0.0], [101.0, 1.0]]
    }, "second value"]];
    var count = 0;

    var _shpDecoder9 = shpDecoder();

    var _shpDecoder92 = _slicedToArray(_shpDecoder9, 2);

    var decoder = _shpDecoder92[0];
    var res = _shpDecoder92[1];

    (0, _fixture.fixture)('simple_multipoints.zip').pipe(decoder).pipe(es.mapSync(function (thing) {
      var columns = thing.columns;
      expect(columns.map(function (c) {
        return c.constructor.name;
      })).to.eql(['SoQLMultiPoint', 'SoQLText']);
      expect(columns.map(function (c) {
        return c.value;
      })).to.eql(expectedValues[count]);
      count++;
    })).on('end', onDone);
  });

  it('can turn simple multilines to SoQLMultiLine', function (onDone) {
    var expectedValues = [[{
      "type": "MultiLineString",
      "coordinates": [[[100.0, 0.0], [101.0, 1.0]], [[102.0, 2.0], [103.0, 3.0]]]
    }, "first value"], [{
      "type": "MultiLineString",
      "coordinates": [[[101.0, 0.0], [102.0, 1.0]], [[102.0, 2.0], [103.0, 3.0]]]
    }, "second value"]];
    var count = 0;

    var _shpDecoder10 = shpDecoder();

    var _shpDecoder102 = _slicedToArray(_shpDecoder10, 2);

    var decoder = _shpDecoder102[0];
    var res = _shpDecoder102[1];

    (0, _fixture.fixture)('simple_multilines.zip').pipe(decoder).pipe(es.mapSync(function (thing) {
      var columns = thing.columns;
      expect(columns.map(function (c) {
        return c.constructor.name;
      })).to.eql(['SoQLMultiLine', 'SoQLText']);
      expect(columns.map(function (c) {
        return c.value;
      })).to.eql(expectedValues[count]);
      count++;
    })).on('end', onDone);
  });

  it('can turn simple multipolygons to SoQLMultiPolygon', function (onDone) {
    var expectedValues = [[{
      "type": "MultiPolygon",
      "coordinates": [[[[102, 2], [102, 3], [103, 3], [103, 2], [102, 2]]], [[[100, 0], [100, 1], [101, 1], [101, 0], [100, 0]], [[100.2, 0.2], [100.8, 0.2], [100.8, 0.8], [100.2, 0.8], [100.2, 0.2]]]]
    }, "first value"], [{
      "type": "MultiPolygon",
      "coordinates": [[[[103, 2], [102, 2], [103, 3], [102, 3], [103, 2]]], [[[100, 0], [100, 1], [101, 1], [101, 0], [100, 0]], [[100.2, 0.2], [100.8, 0.2], [100.8, 0.8], [100.2, 0.8], [100.2, 0.2]]]]
    }, "second value"]];
    var count = 0;

    var _shpDecoder11 = shpDecoder();

    var _shpDecoder112 = _slicedToArray(_shpDecoder11, 2);

    var decoder = _shpDecoder112[0];
    var res = _shpDecoder112[1];

    (0, _fixture.fixture)('simple_multipolygons.zip').pipe(decoder).pipe(es.mapSync(function (thing) {
      var columns = thing.columns;
      expect(columns.map(function (c) {
        return c.constructor.name;
      })).to.eql(['SoQLMultiPolygon', 'SoQLText']);
      expect(columns.map(function (c) {
        return c.value;
      })).to.eql(expectedValues[count]);
      count++;
    })).on('end', onDone);
  });
});