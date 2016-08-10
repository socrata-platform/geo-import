/**
 * this test suite is not for geojson in particular, geojson is just a
 * nice format for the fixtures. this test suite deals with the merger.
 * for geojson-->soql conversion tests, look at the tests/geojson.js suite
 */

import chai from 'chai';
import should from 'should';
import * as es from 'event-stream';
import {
  EventEmitter
}
from 'events';
import {
  fixture
}
from '../fixture';
import through from 'through';
import GeoJSON from '../../lib/decoders/geojson';
import Merger from '../../lib/decoders/merger';
import Disk from '../../lib/decoders/disk';

import SoQLPoint from '../../lib/soql/point';
import SoQLLine from '../../lib/soql/line';
import SoQLPolygon from '../../lib/soql/polygon';
import SoQLMultiPoint from '../../lib/soql/multipoint';
import SoQLMultiLine from '../../lib/soql/multiline';
import SoQLMultiPolygon from '../../lib/soql/multipolygon';
import SoQLText from '../../lib/soql/text';
import SoQLBoolean from '../../lib/soql/boolean';
import SoQLNumber from '../../lib/soql/number';
import SoQLArray from '../../lib/soql/array';
import config from '../../lib/config';

var conf = config();
var expect = chai.expect;

function makeMerger(maxVerticesPerRow) {
  var res = new EventEmitter();
  return [
    new Merger(
      new Disk(res), [],
      false
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



describe('merging feature streams to layers', function() {

  it('will handle homogenous points, default crs', function(onDone) {
    var [merger, response] = makeMerger();
    fixture('simple_points.json')
      .pipe(new GeoJSON())
      .pipe(merger)
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


  it('will handle homogenous points, heterogenous crs', function(onDone) {
    var [merger, response] = makeMerger();

    fixture('multi_crs.json')
      .pipe(new GeoJSON())
      .pipe(merger)
      .on('end', (layers) => {

        expect(layers.length).to.equal(1);

        var [layer] = layers;

        expect(layer.columns.map(c => [c.name, c.ctype])).to.eql([
          ['the_geom', 'point'],
          ['a_string', 'string'],
          ['a_num', 'number'],
          ['a_float', 'number'],
          ['a_bool', 'boolean']
        ]);


        layer.pipe(jsbuf()).on('end', (jsRow) => {
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


  it('will handle homogenous lines, heterogenous crs', function(onDone) {
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
                [-97.48784799692679, 0],
                [-97.48783903791886, 0.000009019385540221545]
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


  it('will handle homogenous polygons, heterogenous crs', function(onDone) {
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
                [
                  [-97.48784799692679, 0],
                  [-97.4878390379188, 0],
                  [-97.48783903791886, 0.000009019385540221545],
                  [-97.48784799692685, 0.000009019385428778238],
                  [-97.48784799692679, 0]
                ],
                [
                  [-97.48784620512521, 0.0000018038770902133842],
                  [-97.48784082972041, 0.000001803877103586581],
                  [-97.48784082972045, 0.000007215508414346324],
                  [-97.48784620512522, 0.000007215508360853537],
                  [-97.48784620512521, 0.0000018038770902133842]
                ]
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


  it('will handle homogenous multipoints, heterogenous crs', function(onDone) {
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
              "coordinates": [
                [-97.48784799692679, 0],
                [-97.48783903791886, 0.000009019385540221545]
              ]
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
                [
                  [-97.48784799692679,
                    0
                  ],
                  [-97.48783903791886,
                    0.000009019385540221545
                  ]
                ],
                [
                  [-97.48783007891092,
                    0.000018038771303329256
                  ],
                  [-97.48782111990299,
                    0.000027058157289322467
                  ]
                ]
              ]
            },
            "a_string": "first value"
          }, {
            "the_geom": {
              "type": "MultiLineString",
              "coordinates": [
                [
                  [
                    101,
                    0
                  ],
                  [
                    102,
                    1
                  ]
                ],
                [
                  [
                    102,
                    2
                  ],
                  [
                    103,
                    3
                  ]
                ]
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
                [
                  [
                    [-97.48783007891092,
                      0.000018038771303329256
                    ],
                    [-97.48782111990273,
                      0.00001803877152621498
                    ],
                    [-97.48782111990299,
                      0.000027058157289322467
                    ],
                    [-97.4878300789112,
                      0.00002705815695499387
                    ],
                    [-97.48783007891092,
                      0.000018038771303329256
                    ]
                  ]
                ],
                [
                  [
                    [-97.48784799692679,
                      0
                    ],
                    [-97.4878390379188,
                      0
                    ],
                    [-97.48783903791886,
                      0.000009019385540221545
                    ],
                    [-97.48784799692685,
                      0.000009019385428778238
                    ],
                    [-97.48784799692679,
                      0
                    ]
                  ],
                  [
                    [-97.48784620512521,
                      0.0000018038770902133842
                    ],
                    [-97.48784082972041,
                      0.000001803877103586581
                    ],
                    [-97.48784082972045,
                      0.000007215508414346324
                    ],
                    [-97.48784620512522,
                      0.000007215508360853537
                    ],
                    [-97.48784620512521,
                      0.0000018038770902133842
                    ]
                  ]
                ]
              ]
            },
            "a_string": "first value"
          }, {
            "the_geom": {
              "type": "MultiPolygon",
              "coordinates": [
                [
                  [
                    [
                      103,
                      2
                    ],
                    [
                      102,
                      2
                    ],
                    [
                      103,
                      3
                    ],
                    [
                      102,
                      3
                    ],
                    [
                      103,
                      2
                    ]
                  ]
                ],
                [
                  [
                    [
                      100,
                      0
                    ],
                    [
                      101,
                      0
                    ],
                    [
                      101,
                      1
                    ],
                    [
                      100,
                      1
                    ],
                    [
                      100,
                      0
                    ]
                  ],
                  [
                    [
                      100.2,
                      0.2
                    ],
                    [
                      100.8,
                      0.2
                    ],
                    [
                      100.8,
                      0.8
                    ],
                    [
                      100.2,
                      0.8
                    ],
                    [
                      100.2,
                      0.2
                    ]
                  ]
                ]
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
        expect(err.toString()).to.contain('Number of vertices exceeds')
        onDone();
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
        })
      });
  });
});