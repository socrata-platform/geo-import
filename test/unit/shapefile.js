import chai from 'chai';
import should from 'should';
import * as es from 'event-stream';
import {
  fixture
}
from '../fixture';
import Shapefile from '../../lib/decoders/shapefile';
import srs from 'node-srs';
import Disk from '../../lib/decoders/disk';
import {
  EventEmitter
}
from 'events';
var expect = chai.expect;
var res;

function shpDecoder() {
  res = new EventEmitter()
  return [new Shapefile(new Disk(res)), res]
}



describe('shapefile decoder', function() {

  afterEach(function() {
    res.emit('finish');
  })

  it('will emit an error for a corrupt shapefile', function(onDone) {
    var count = 0;
    var [decoder, res] = shpDecoder();
    fixture('corrupt_shapefile.zip')
      .pipe(decoder)
      .on('error', (err) => {
        expect(err.toString()).to.contain("Failed to read feature");
        onDone();
      });
  });

  it('correctly reads .prj file for non epsg4326 features and populates the geojson feature with it', function(onDone) {
    var [decoder, res] = shpDecoder();
    fixture('simple_points_epsg_2834.zip')
      .pipe(decoder)
      .pipe(es.mapSync(function(feature) {
        var parsedCrs = srs.parse(feature.crs)
        expect(parsedCrs.valid).to.equal(true);
        expect(parsedCrs.proj4).to.equal("+proj=lcc +lat_1=41.7 +lat_2=40.43333333333333 +lat_0=39.66666666666666 +lon_0=-82.5 +x_0=600000 +y_0=0 +ellps=GRS80 +units=m +no_defs")
      })).on('end', onDone);
  });

  it('defaults to default projection when prj is not there', function(onDone) {
    var [decoder, res] = shpDecoder();
    fixture('simple_points_sans_prj.zip')
      .pipe(decoder)
      .pipe(es.mapSync(function(feature) {
        var parsedCrs = srs.parse(feature.crs)
        expect(parsedCrs.valid).to.equal(true);
        expect(parsedCrs.proj4).to.equal("+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs")
      })).on('end', onDone);
  });

  it('can turn simple points to SoQLPoint', function(onDone) {
    var expectedValues = [
      [{
          "type": "Point",
          "coordinates": [
            102.0,
            0.5
          ]
        },
        "first value",
        2,
        2.2,
        0
      ],
      [{
          "type": "Point",
          "coordinates": [
            103.0,
            1.5
          ]
        },

        "second value",
        2,
        2.2,
        1
      ]
    ];

    var count = 0;
    var [decoder, res] = shpDecoder();
    fixture('simple_points.zip')
      .pipe(decoder)
      .pipe(es.mapSync(function(thing) {
        let columns = thing.columns;
        expect(columns.map((c) => c.constructor.name)).to.eql([
          'SoQLPoint',
          'SoQLText',
          'SoQLNumber',
          'SoQLNumber',
          'SoQLNumber'
        ]);
        expect(columns.map((c) => c.value)).to.eql(expectedValues[count]);
        count++;
      })).on('end', () => {
        expect(count).to.equal(2);
        onDone();
      });
  });

  it('can turn simple lines to SoQLLine', function(onDone) {
    var expectedValues = [
      [{
          "type": "LineString",
          "coordinates": [
            [
              100.0,
              0.0
            ],
            [
              101.0,
              1.0
            ]
          ]
        },
        "first value"
      ],
      [{
          "type": "LineString",
          "coordinates": [
            [
              101.0,
              0.0
            ],
            [
              101.0,
              1.0
            ]
          ]
        },
        "second value"
      ]
    ];
    var count = 0;
    var [decoder, res] = shpDecoder();
    fixture('simple_lines.zip')
      .pipe(decoder)
      .pipe(es.mapSync(function(thing) {

        let columns = thing.columns;
        expect(columns.map((c) => c.constructor.name)).to.eql([
          'SoQLLine',
          'SoQLText'
        ]);
        expect(columns.map((c) => c.value)).to.eql(expectedValues[count]);
        count++;
      })).on('end', onDone);
  });

  it('can turn simple polys to SoQLPolygon', function(onDone) {
    var expectedValues = [
      [{
          "type": "MultiPolygon",
          "coordinates": [[
            [
              [100, 0],
              [100, 1],
              [101, 1],
              [101, 0],
              [100, 0]
            ],
            [
              [100.2, 0.2],
              [100.8, 0.2],
              [100.8, 0.8],
              [100.2, 0.8],
              [100.2, 0.2]
            ]
          ]]
        },
        "first value"
      ],
      [{
          "type": "MultiPolygon",
          "coordinates": [[
            [
              [100, 0],
              [100, 1],
              [101, 1],
              [101, 0],
              [100, 0]
            ],
            [
              [100.2, 0.2],
              [100.8, 0.2],
              [100.8, 0.8],
              [100.2, 0.8],
              [100.2, 0.2]
            ]
          ]]
        },
        "second value"
      ]
    ];
    var count = 0;

    var [decoder, res] = shpDecoder();
    fixture('simple_polygons.zip')
      .pipe(decoder)
      .pipe(es.mapSync(function(thing) {
        let columns = thing.columns;
        expect(columns.map((c) => c.constructor.name)).to.eql([
          'SoQLMultiPolygon',
          'SoQLText'
        ]);
        expect(columns.map((c) => c.value)).to.eql(expectedValues[count]);
        count++;
      })).on('end', onDone);
  });

  it('can turn simple multipoints to SoQLMultiPoint', function(onDone) {
    var expectedValues = [
      [{
          "type": "MultiPoint",
          "coordinates": [
            [100.0, 0.0],
            [101.0, 1.0]
          ]
        },
        "first value"
      ],
      [{
          "type": "MultiPoint",
          "coordinates": [
            [101.0, 0.0],
            [101.0, 1.0]
          ]
        },
        "second value"
      ]
    ];
    var count = 0;

    var [decoder, res] = shpDecoder();
    fixture('simple_multipoints.zip')
      .pipe(decoder)
      .pipe(es.mapSync(function(thing) {
        let columns = thing.columns;
        expect(columns.map((c) => c.constructor.name)).to.eql([
          'SoQLMultiPoint',
          'SoQLText'
        ]);
        expect(columns.map((c) => c.value)).to.eql(expectedValues[count]);
        count++;
      })).on('end', onDone);
  });

  it('can turn simple multilines to SoQLMultiLine', function(onDone) {
    var expectedValues = [
      [{
          "type": "MultiLineString",
          "coordinates": [
            [
              [100.0, 0.0],
              [101.0, 1.0]
            ],
            [
              [102.0, 2.0],
              [103.0, 3.0]
            ]
          ]
        },
        "first value"
      ],
      [{
          "type": "MultiLineString",
          "coordinates": [
            [
              [101.0, 0.0],
              [102.0, 1.0]
            ],
            [
              [102.0, 2.0],
              [103.0, 3.0]
            ]
          ]
        },
        "second value"
      ]
    ];
    var count = 0;

    var [decoder, res] = shpDecoder();
    fixture('simple_multilines.zip')
      .pipe(decoder)
      .pipe(es.mapSync(function(thing) {
        let columns = thing.columns;
        expect(columns.map((c) => c.constructor.name)).to.eql([
          'SoQLMultiLine',
          'SoQLText'
        ]);
        expect(columns.map((c) => c.value)).to.eql(expectedValues[count]);
        count++;

      })).on('end', onDone);
  });

  it('can turn simple multipolygons to SoQLMultiPolygon', function(onDone) {
    var expectedValues = [
      [{
          "type": "MultiPolygon",
          "coordinates": [
            [
              [
                [102, 2],
                [102, 3],
                [103, 3],
                [103, 2],
                [102, 2]
              ]
            ],
            [
              [
                [100, 0],
                [100, 1],
                [101, 1],
                [101, 0],
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
          ]
        },
        "first value"
      ],
      [{
          "type": "MultiPolygon",
          "coordinates": [
            [
              [
                [103, 2],
                [102, 2],
                [103, 3],
                [102, 3],
                [103, 2]
              ]
            ],
            [
              [
                [100, 0],
                [100, 1],
                [101, 1],
                [101, 0],
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
          ]
        },
        "second value"
      ]
    ];
    var count = 0;
    var [decoder, res] = shpDecoder();
    fixture('simple_multipolygons.zip')
      .pipe(decoder)
      .pipe(es.mapSync(function(thing) {
        let columns = thing.columns;
        expect(columns.map((c) => c.constructor.name)).to.eql([
          'SoQLMultiPolygon',
          'SoQLText'
        ]);
        expect(columns.map((c) => c.value)).to.eql(expectedValues[count]);
        count++;
      })).on('end', onDone);
  });
});