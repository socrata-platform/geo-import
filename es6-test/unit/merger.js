/**
 * this test suite is not for geojson in particular, geojson is just a
 * nice format for the fixtures. this test suite deals with the merger.
 * for geojson-->soql conversion tests, look at the tests/geojson.js suite
 */

import chai from 'chai';
import should from 'should';
import { EventEmitter } from 'events';
import { fixture } from '../fixture.js';
import { NoopLogger } from '../util.js';
import through from 'through';
import GeoJSON from '../../es6-lib/decoders/geojson.js';
import Merger from '../../es6-lib/decoders/merger.js';
import Disk from '../../es6-lib/decoders/disk.js';
import SoQLPoint from '../../es6-lib/soql/point.js';
import SoQLLine from '../../es6-lib/soql/line.js';
import SoQLPolygon from '../../es6-lib/soql/polygon.js';
import SoQLMultiPoint from '../../es6-lib/soql/multipoint.js';
import SoQLMultiLine from '../../es6-lib/soql/multiline.js';
import SoQLMultiPolygon from '../../es6-lib/soql/multipolygon.js';
import SoQLText from '../../es6-lib/soql/text.js';
import SoQLBoolean from '../../es6-lib/soql/boolean.js';
import SoQLNumber from '../../es6-lib/soql/number.js';
import SoQLArray from '../../es6-lib/soql/array.js';
import config from '../../es6-lib/config/index.js';

var conf = config();
var expect = chai.expect;

function makeMerger(maxVerticesPerRow) {
  var res = new EventEmitter();
  return [
    new Merger(
      new Disk(res, NoopLogger),
      [],
      false,
      NoopLogger
    ),
    res
  ];
}

function jsbuf() {
  var s = '';
  return through(function write(data) {
    s += data.toString('utf-8');
  }, function end() {
    this.emit('end', JSON.parse(s));
  });
}

const FLOAT_DELTA = 0.000000001;

describe('merging feature streams to layers', function() {

  it('will handle homogenous points, default crs', function(onDone) {
    var [merger, response] = makeMerger();
    fixture('simple_points.json')
      .pipe(new GeoJSON())
      .pipe(merger)
      .on('error', (e) => console.error(e))
      .on('end', (layers) => {
        response.emit('finish');
        expect(layers.length).to.equal(1);

        var [layer] = layers;

        expect(layer.columns.map(c => [c.name, c.ctype])).to.eql([
          ['the_geom', 'point'],
          ['a_string', 'string'],
          ['a_num', 'number'],
          ['a_float', 'number'],
          ['a_bool', 'boolean']
        ]);

        layer.pipe(jsbuf()).on('end', function(jsRow) {
          expect(jsRow).to.eql([{
            "the_geom": {
              "type": "Point",
              "coordinates": [
                102,
                0.5
              ]
            },
            "a_string": "first value",
            "a_num": 2,
            "a_float": 2.2,
            "a_bool": false
          }, {
            "the_geom": {
              "type": "Point",
              "coordinates": [
                103,
                1.5
              ]
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


  it('will handle homogenous points, heterogenous non wgs84 crs', function(onDone) {
    var [merger, response] = makeMerger();
    fixture('multi_non_wgs84.json')
      .pipe(new GeoJSON())
      .pipe(merger)
      .on('end', (layers) => {

        expect(layers.length).to.equal(2);

        const expectedColumns = [
          ['the_geom', 'point'],
          ['a_string', 'string'],
          ['a_num', 'number'],
          ['a_float', 'number'],
          ['a_bool', 'boolean']
        ];

        layers.forEach(layer => {
          expect(layer.columns.map(c => [c.name, c.ctype])).to.eql(expectedColumns);
        });

        var [epsg26915, epsg23700] = layers;

        epsg26915.pipe(jsbuf()).on('end', ([row]) => {
          var [x, y] = row.the_geom.coordinates;
          expect(x).to.be.closeTo(-97.48783007892, FLOAT_DELTA);
          expect(y).to.be.closeTo(0.00000450965,  FLOAT_DELTA);

          epsg23700.pipe(jsbuf()).on('end', ([row]) => {
            var [x, y] = row.the_geom.coordinates;
            expect(x).to.be.closeTo(10.7889673904, FLOAT_DELTA);
            expect(y).to.be.closeTo(45.0359670320,  FLOAT_DELTA);
            onDone();
          });
        });
      });
  });


  it('will handle homogenous points, heterogenous crs', function(onDone) {
    var [merger, response] = makeMerger();

    fixture('multi_crs.json')
      .pipe(new GeoJSON())
      .pipe(merger)
      .on('end', (layers) => {

        expect(layers.length).to.equal(2);

        layers.forEach(layer => {
          expect(layer.columns.map(c => [c.name, c.ctype])).to.eql([
            ['the_geom', 'point'],
            ['a_string', 'string'],
            ['a_num', 'number'],
            ['a_float', 'number'],
            ['a_bool', 'boolean']
          ]);
        });

        var [epsg26915, crs84] = layers;

        epsg26915.pipe(jsbuf()).on('end', ([row]) => {
          var [x, y] = row.the_geom.coordinates;
          expect(x).to.be.closeTo(-97.48783007891072, FLOAT_DELTA);
          expect(y).to.be.closeTo(  0.00000450969282, FLOAT_DELTA);

          crs84.pipe(jsbuf()).on('end', ([row]) => {
            var [x, y] = row.the_geom.coordinates;
            expect(x).to.be.closeTo(103, FLOAT_DELTA);
            expect(y).to.be.closeTo(1.5, FLOAT_DELTA);
            onDone();
          });
        });
      });
  });


  it('will handle homogenous lines, homogenous crs', function(onDone) {
    var [merger, response] = makeMerger();

    fixture('simple_lines.json')
      .pipe(new GeoJSON())
      .pipe(merger)
      .on('end', (layers) => {
        response.emit('finish');
        expect(layers.length).to.equal(1);

        var [layer] = layers;

        expect(layer.columns.map(c => [c.name, c.ctype])).to.eql([
          ['the_geom', 'linestring'],
          ['a_string', 'string']
        ]);


        layer.pipe(jsbuf()).on('end', function(jsRow) {
          expect(jsRow).to.eql([{
            "the_geom": {
              "type": "LineString",
              "coordinates": [
                [100, 0],
                [101, 1]
              ]
            },
            "a_string": "first value"
          }, {
            "the_geom": {
              "type": "LineString",
              "coordinates": [
                [101, 0],
                [101, 1]
              ]
            },
            "a_string": "second value"
          }]);
          onDone();
        });
      });
  });


  it('will handle homogenous polygons, homogenous crs', function(onDone) {
    var [merger, response] = makeMerger();
    fixture('simple_polygons.json')
      .pipe(new GeoJSON())
      .pipe(merger)
      .on('end', (layers) => {
        response.emit('finish');
        expect(layers.length).to.equal(1);

        var [layer] = layers;

        expect(layer.columns.map(c => [c.name, c.ctype])).to.eql([
          ['the_geom', 'polygon'],
          ['a_string', 'string']
        ]);


        layer.pipe(jsbuf()).on('end', function(jsRow) {
          expect(jsRow).to.eql([{
            "the_geom": {
              "type": "Polygon",
              "coordinates": [
                [ [100.0, 0.0], [101.0, 0.0], [101.0, 1.0], [100.0, 1.0], [100.0, 0.0] ],
                [ [100.2, 0.2], [100.8, 0.2], [100.8, 0.8], [100.2, 0.8], [100.2, 0.2] ]
              ]
            },
            "a_string": "first value"
          }, {
            "the_geom": {
              "type": "Polygon",
              "coordinates": [
                [
                  [100, 0],
                  [101, 0],
                  [101, 1],
                  [100, 1],
                  [100, 0]
                ],
                [
                  [100.2, 0.2],
                  [100.8, 0.2],
                  [100.8, 0.8],
                  [100.2, 0.8],
                  [100.2, 0.2]
                ]
              ]
            },
            "a_string": "second value"
          }]);
          onDone();
        });
      });
  });


  it('will handle homogenous multipoints, homogenous crs', function(onDone) {
    var [merger, response] = makeMerger();

    fixture('simple_multipoints.json')
      .pipe(new GeoJSON())
      .pipe(merger)
      .on('end', (layers) => {
        response.emit('finish');
        expect(layers.length).to.equal(1);

        var [layer] = layers;

        expect(layer.columns.map(c => [c.name, c.ctype])).to.eql([
          ['the_geom', 'multipoint'],
          ['a_string', 'string']
        ]);

        layer.pipe(jsbuf()).on('end', (jsRow) => {

          expect(jsRow).to.eql([{
            "the_geom": {
              "type": "MultiPoint",
              "coordinates": [ [100.0, 0.0], [101.0, 1.0] ]
            },
            "a_string": "first value"
          }, {
            "the_geom": {
              "type": "MultiPoint",
              "coordinates": [
                [101, 0],
                [101, 1]
              ]
            },
            "a_string": "second value"
          }]);
          onDone();
        });
      });
  });


  it('will handle homogenous multilines, heterogenous crs', function(onDone) {
    var [merger, response] = makeMerger();

    fixture('simple_multilines.json')
      .pipe(new GeoJSON())
      .pipe(merger)
      .on('end', (layers) => {
        response.emit('finish');
        expect(layers.length).to.equal(1);

        var [layer] = layers;

        expect(layer.columns.map(c => [c.name, c.ctype])).to.eql([
          ['the_geom', 'multilinestring'],
          ['a_string', 'string']
        ]);


        layer.pipe(jsbuf()).on('end', function(jsRow) {
          expect(jsRow).to.eql([{
            "the_geom": {
              "type": "MultiLineString",
              "coordinates": [
                [ [100.0, 0.0], [101.0, 1.0] ],
                [ [102.0, 2.0], [103.0, 3.0] ]
              ]
            },
            "a_string": "first value"
          }, {
            "the_geom": {
              "type": "MultiLineString",
              "coordinates": [
                [ [101.0, 0.0], [102.0, 1.0] ],
                [ [102.0, 2.0], [103.0, 3.0] ]
              ]
            },
            "a_string": "second value"
          }]);
          onDone();
        });
      });
  });


  it('will handle homogenous multipolygons, heterogenous crs', function(onDone) {
    var [merger, response] = makeMerger();

    fixture('simple_multipolygons.json')
      .pipe(new GeoJSON())
      .pipe(merger)
      .on('end', (layers) => {
        response.emit('finish');
        expect(layers.length).to.equal(1);

        var [layer] = layers;

        expect(layer.columns.map(c => [c.name, c.ctype])).to.eql([
          ['the_geom', 'multipolygon'],
          ['a_string', 'string']
        ]);


        var features = [];
        layer.pipe(jsbuf()).on('end', function(jsRow) {
          expect(jsRow).to.eql([{
            "the_geom": {
              "type": "MultiPolygon",
              "coordinates": [
                [[[102.0, 2.0], [103.0, 2.0], [103.0, 3.0], [102.0, 3.0], [102.0, 2.0]]],
                [[[100.0, 0.0], [101.0, 0.0], [101.0, 1.0], [100.0, 1.0], [100.0, 0.0]],
                 [[100.2, 0.2], [100.8, 0.2], [100.8, 0.8], [100.2, 0.8], [100.2, 0.2]]]
              ]
            },
            "a_string": "first value"
          }, {
            "the_geom": {
              "type": "MultiPolygon",
              "coordinates": [
                [[[103.0, 2.0], [102.0, 2.0], [103.0, 3.0], [102.0, 3.0], [103.0, 2.0]]],
                [[[100.0, 0.0], [101.0, 0.0], [101.0, 1.0], [100.0, 1.0], [100.0, 0.0]],
                 [[100.2, 0.2], [100.8, 0.2], [100.8, 0.8], [100.2, 0.8], [100.2, 0.2]]]
                ]
            },
            "a_string": "second value"
          }]);

          onDone();
        });
      });
  });

  it('will emit an error if there are too many vertices', function(onDone) {
    const oldMax = conf.maxVerticesPerRow;
    conf.maxVerticesPerRow = 2;

    var [merger, response] = makeMerger();
    fixture('simple_polygons.json')
      .pipe(new GeoJSON())
      .pipe(merger)
      .on('error', (err) => {
        conf.maxVerticesPerRow = oldMax;
        expect(err.toJSON().info.english).to.contain('There were 10 vertices in row 1, the max is');
        onDone();
      });
  });

  it('will emit an error if a row has invalid arity', function(onDone) {
    var [merger, response] = makeMerger();
    fixture('simple_points_invalid_arity.json')
      .pipe(new GeoJSON())
      .pipe(merger)
      .on('end', (layers) => {
        response.emit('finish');
        expect(layers.length).to.equal(1);
        var [layer] = layers;

        layer.on('error', (error) => {
          const brokenRow = JSON.stringify([{
            "type": "Point",
            "coordinates": [
              103.0
            ]
          }, 'second value', 2, 2.2, true]);
          expect(error.toJSON()).to.eql({
            eventType: 'invalid-arity-error',
            info: {
              english: `One of the points in the following row did not have 2 coordinates ${brokenRow}`,
              row: brokenRow
            }
          });
          onDone();
        });

        layer.pipe(jsbuf());
      });
  });

  it('will dedupe column names that end up the same after laundering', function(onDone) {
    var [merger, response] = makeMerger();
    fixture('simple_points_dup_columns.json')
      .pipe(new GeoJSON())
      .pipe(merger)
      .on('end', ([layer]) => {
        layer.pipe(jsbuf()).on('end', ([row]) => {

          expect(row.a_string).to.equal('first string');
          expect(row.a_string_1).to.equal('second string');
          expect(row.a_string_2).to.equal('third string');
          expect(row.a_string_3).to.equal('fourth string');

          onDone();
        });
      });
  });
});