'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _chai = require('chai');

var _chai2 = _interopRequireDefault(_chai);

var _should = require('should');

var _should2 = _interopRequireDefault(_should);

var _eventStream = require('event-stream');

var _eventStream2 = _interopRequireDefault(_eventStream);

var _fixture = require('../fixture');

var _events = require('events');

var _libDecodersKmz = require('../../lib/decoders/kmz');

var _libDecodersKmz2 = _interopRequireDefault(_libDecodersKmz);

var _libDecodersDisk = require('../../lib/decoders/disk');

var _libDecodersDisk2 = _interopRequireDefault(_libDecodersDisk);

var expect = _chai2['default'].expect;

var res;

function kmzDecoder() {
  res = new _events.EventEmitter();
  return new _libDecodersKmz2['default'](new _libDecodersDisk2['default'](res));
}

afterEach(function () {
  res && res.emit('finish');
});

describe('kmz decoder', function () {
  it('will emit an error for a corrupt kmz file', function (onDone) {
    var count = 0;
    (0, _fixture.fixture)('corrupt_kmz.kmz').pipe(kmzDecoder()).on('error', function (err) {
      expect(err.toString()).to.contain("invalid central directory");
      onDone();
    }).pipe(_eventStream2['default'].mapSync(function () {}));
  });

  it('will emit an error for unparsable kml within the kmz', function (onDone) {
    var count = 0;
    (0, _fixture.fixture)('malformed_kmz.kmz').pipe(kmzDecoder()).on('error', function (err) {
      expect(err.toString()).to.contain("XML Parse error");
      onDone();
    }).pipe(_eventStream2['default'].mapSync(function () {}));
  });

  it('can turn simple kmz points to SoQLPoint', function (onDone) {
    var count = 0;

    var expectedValues = [[{
      "type": "Point",
      "coordinates": [102.0, 0.5]
    }, "first value", 2, 2.2, false], [{
      "type": "Point",
      "coordinates": [103.0, 1.5]
    }, "second value", 2, 2.2, true]];

    (0, _fixture.fixture)('simple_points.kmz').pipe(kmzDecoder()).pipe(_eventStream2['default'].mapSync(function (thing) {
      var columns = thing.columns;

      expect(columns.map(function (c) {
        return c.constructor.name;
      })).to.eql(['SoQLPoint', 'SoQLText', 'SoQLNumber', 'SoQLNumber', 'SoQLBoolean']);

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

    (0, _fixture.fixture)('simple_lines.kmz').pipe(kmzDecoder()).pipe(_eventStream2['default'].mapSync(function (thing) {
      var columns = thing.columns;
      expect(columns.map(function (c) {
        return c.constructor.name;
      })).to.eql(['SoQLLine', 'SoQLText']);

      // console.log(columns.map((c) => c.value), expectedValues[count])
      expect(columns.map(function (c) {
        return c.value;
      })).to.eql(expectedValues[count]);

      count++;
    })).on('end', function () {
      expect(count).to.equal(2);
      onDone();
    });
  });

  it('can turn simple polys to SoQLPolygon', function (onDone) {
    var expectedValues = [[{
      "type": "Polygon",
      "coordinates": [[[100.0, 0.0], [101.0, 0.0], [101.0, 1.0], [100.0, 1.0], [100.0, 0.0]], [[100.2, 0.2], [100.8, 0.2], [100.8, 0.8], [100.2, 0.8], [100.2, 0.2]]]
    }, "first value"], [{
      "type": "Polygon",
      "coordinates": [[[100.0, 0.0], [101.0, 0.0], [101.0, 1.0], [100.0, 1.0], [100.0, 0.0]], [[100.2, 0.2], [100.8, 0.2], [100.8, 0.8], [100.2, 0.8], [100.2, 0.2]]]
    }, "second value"]];

    var count = 0;
    (0, _fixture.fixture)('simple_polygons.kmz').pipe(kmzDecoder()).pipe(_eventStream2['default'].mapSync(function (thing) {
      var columns = thing.columns;
      expect(columns.map(function (c) {
        return c.constructor.name;
      })).to.eql(['SoQLPolygon', 'SoQLText']);

      expect(columns.map(function (c) {
        return c.value;
      })).to.eql(expectedValues[count]);
      count++;
    })).on('end', onDone);
  });

  it('can turn simple points to SoQLMultiPoint', function (onDone) {
    var expectedValues = [[{
      "type": "MultiPoint",
      "coordinates": [[100.0, 0.0], [101.0, 1.0]]
    }, "first value"], [{
      "type": "MultiPoint",
      "coordinates": [[101.0, 0.0], [101.0, 1.0]]
    }, "second value"]];

    var count = 0;
    (0, _fixture.fixture)('simple_multipoints.kmz').pipe(kmzDecoder()).pipe(_eventStream2['default'].mapSync(function (thing) {
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

  it('can turn simple points to SoQLMultiLine', function (onDone) {
    var expectedValues = [[{
      "type": "MultiLineString",
      "coordinates": [[[100.0, 0.0], [101.0, 1.0]], [[102.0, 2.0], [103.0, 3.0]]]
    }, "first value"], [{
      "type": "MultiLineString",
      "coordinates": [[[101.0, 0.0], [102.0, 1.0]], [[102.0, 2.0], [103.0, 3.0]]]
    }, "second value"]];

    var count = 0;
    (0, _fixture.fixture)('simple_multilines.kmz').pipe(kmzDecoder()).pipe(_eventStream2['default'].mapSync(function (thing) {
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

  it('can turn simple points to SoQLMultiPolygon', function (onDone) {
    var expectedValues = [[{
      "type": "MultiPolygon",
      "coordinates": [[[[102.0, 2.0], [103.0, 2.0], [103.0, 3.0], [102.0, 3.0], [102.0, 2.0]]], [[[100.0, 0.0], [101.0, 0.0], [101.0, 1.0], [100.0, 1.0], [100.0, 0.0]], [[100.2, 0.2], [100.8, 0.2], [100.8, 0.8], [100.2, 0.8], [100.2, 0.2]]]]
    }, "first value"], [{
      "type": "MultiPolygon",
      "coordinates": [[[[103.0, 2.0], [102.0, 2.0], [103.0, 3.0], [102.0, 3.0], [103.0, 2.0]]], [[[100.0, 0.0], [101.0, 0.0], [101.0, 1.0], [100.0, 1.0], [100.0, 0.0]], [[100.2, 0.2], [100.8, 0.2], [100.8, 0.8], [100.2, 0.8], [100.2, 0.2]]]]
    }, "second value"]];

    var count = 0;
    (0, _fixture.fixture)('simple_multipolygons.kmz').pipe(kmzDecoder()).pipe(_eventStream2['default'].mapSync(function (thing) {
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