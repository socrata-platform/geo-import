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

var _libDecodersKml = require('../../lib/decoders/kml');

var _libDecodersKml2 = _interopRequireDefault(_libDecodersKml);

var expect = _chai2['default'].expect;

describe('kml decoder', function () {

  it('will emit an error for unparsable kml', function (onDone) {
    var count = 0;
    (0, _fixture.fixture)('malformed_kml.kml').pipe(new _libDecodersKml2['default']()).on('error', function (err) {
      expect(err.toString()).to.contain("XML Parse error");
      onDone();
    });
  });

  it('can turn kml simple points to SoQLPoint', function (onDone) {
    var expectedValues = [[{
      "type": "Point",
      "coordinates": [102.0, 0.5]
    }, "first value", 2, 2.2, false], [{
      "type": "Point",
      "coordinates": [103.0, 1.5]
    }, "second value", 2, 2.2, true]];

    var kml = new _libDecodersKml2['default']();
    var count = 0;

    (0, _fixture.fixture)('simple_points.kml').pipe(kml).pipe(es.mapSync(function (thing) {
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

  it('can turn kml simple lines to SoQLLine', function (onDone) {

    var expectedValues = [[{
      "type": "LineString",
      "coordinates": [[100.0, 0.0], [101.0, 1.0]]
    }, "first value"], [{
      "type": "LineString",
      "coordinates": [[101.0, 0.0], [101.0, 1.0]]
    }, "second value"]];

    var kml = new _libDecodersKml2['default']();
    var count = 0;

    (0, _fixture.fixture)('simple_lines.kml').pipe(kml).pipe(es.mapSync(function (thing) {
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

  it('can turn kml simple polys to SoQLPolygon', function (onDone) {
    var expectedValues = [[{
      "type": "Polygon",
      "coordinates": [[[100.0, 0.0], [101.0, 0.0], [101.0, 1.0], [100.0, 1.0], [100.0, 0.0]], [[100.2, 0.2], [100.8, 0.2], [100.8, 0.8], [100.2, 0.8], [100.2, 0.2]]]
    }, "first value"], [{
      "type": "Polygon",
      "coordinates": [[[100.0, 0.0], [101.0, 0.0], [101.0, 1.0], [100.0, 1.0], [100.0, 0.0]], [[100.2, 0.2], [100.8, 0.2], [100.8, 0.8], [100.2, 0.8], [100.2, 0.2]]]
    }, "second value"]];

    var kml = new _libDecodersKml2['default']();
    var count = 0;
    (0, _fixture.fixture)('simple_polygons.kml').pipe(kml).pipe(es.mapSync(function (thing) {
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

  it('can turn kml simple multipoints to SoQLMultiPoint', function (onDone) {
    var expectedValues = [[{
      "type": "MultiPoint",
      "coordinates": [[100.0, 0.0], [101.0, 1.0]]
    }, "first value"], [{
      "type": "MultiPoint",
      "coordinates": [[101.0, 0.0], [101.0, 1.0]]
    }, "second value"]];

    var kml = new _libDecodersKml2['default']();
    var count = 0;
    (0, _fixture.fixture)('simple_multipoints.kml').pipe(kml).pipe(es.mapSync(function (thing) {
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

  it('can turn kml simple multilines to SoQLMultiLine', function (onDone) {
    var expectedValues = [[{
      "type": "MultiLineString",
      "coordinates": [[[100.0, 0.0], [101.0, 1.0]], [[102.0, 2.0], [103.0, 3.0]]]
    }, "first value"], [{
      "type": "MultiLineString",
      "coordinates": [[[101.0, 0.0], [102.0, 1.0]], [[102.0, 2.0], [103.0, 3.0]]]
    }, "second value"]];

    var kml = new _libDecodersKml2['default']();
    var count = 0;
    (0, _fixture.fixture)('simple_multilines.kml').pipe(kml).pipe(es.mapSync(function (thing) {
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

  it('can turn kml simple multipolys to SoQLMultiPolygon', function (onDone) {
    var expectedValues = [[{
      "type": "MultiPolygon",
      "coordinates": [[[[102.0, 2.0], [103.0, 2.0], [103.0, 3.0], [102.0, 3.0], [102.0, 2.0]]], [[[100.0, 0.0], [101.0, 0.0], [101.0, 1.0], [100.0, 1.0], [100.0, 0.0]], [[100.2, 0.2], [100.8, 0.2], [100.8, 0.8], [100.2, 0.8], [100.2, 0.2]]]]
    }, "first value"], [{
      "type": "MultiPolygon",
      "coordinates": [[[[103.0, 2.0], [102.0, 2.0], [103.0, 3.0], [102.0, 3.0], [103.0, 2.0]]], [[[100.0, 0.0], [101.0, 0.0], [101.0, 1.0], [100.0, 1.0], [100.0, 0.0]], [[100.2, 0.2], [100.8, 0.2], [100.8, 0.8], [100.2, 0.8], [100.2, 0.2]]]]
    }, "second value"]];

    var kml = new _libDecodersKml2['default']();
    var count = 0;
    (0, _fixture.fixture)('simple_multipolygons.kml').pipe(kml).pipe(es.mapSync(function (thing) {
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

  it('can turn kml multi geometry heterogenous shapes into SoQL', function (onDone) {

    var kml = new _libDecodersKml2['default']();
    var things = [];

    var pointExpected = [{
      "type": "MultiPoint",
      "coordinates": [[102.0, 0.5]]
    }, "first value"];

    var lineExpected = [{
      "type": "MultiLineString",
      "coordinates": [[[101.0, 0.0], [101.0, 1.0]]]
    }, "first value"];

    (0, _fixture.fixture)('points_and_lines_multigeom.kml').pipe(kml).pipe(es.mapSync(function (thing) {
      return things.push(thing);
    })).on('end', function () {
      var t0 = things[0];
      var t1 = things[1];

      expect(t0.columns.map(function (c) {
        return c.value;
      })).to.eql(pointExpected);
      expect(t1.columns.map(function (c) {
        return c.value;
      })).to.eql(lineExpected);

      onDone();
    });
  });

  it('can turn kml multi geometry heterogenous shapes into SoQL', function (onDone) {

    var kml = new _libDecodersKml2['default']();
    var things = [];

    var pointExpected = [{
      "type": "MultiPoint",
      "coordinates": [[102.0, 0.5]]
    }, "first value"];

    var lineExpected = [{
      "type": "MultiLineString",
      "coordinates": [[[101.0, 0.0], [101.0, 1.0]]]
    }, "first value"];

    (0, _fixture.fixture)('points_and_lines_multigeom_sans_schema.kml').pipe(kml).pipe(es.mapSync(function (thing) {
      return things.push(thing);
    })).on('end', function () {
      var t0 = things[0];
      var t1 = things[1];

      expect(t0.columns.map(function (c) {
        return c.value;
      })).to.eql(pointExpected);
      expect(t1.columns.map(function (c) {
        return c.value;
      })).to.eql(lineExpected);

      onDone();
    });
  });
});