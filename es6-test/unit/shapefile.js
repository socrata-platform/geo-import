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
import DevNull from '../../lib/util/devnull';
import {
  ArityChecker
}
from '../util';
var expect = chai.expect;
var res;

function shpDecoder() {
  res = new EventEmitter();
  return [new Shapefile(new Disk(res)), res];
}



describe('shapefile decoder', function() {

  afterEach(function() {
    res.emit('finish');
  });

  it('will emit an error for a corrupt shapefile', function(onDone) {
    var count = 0;
    var [decoder, res] = shpDecoder();
    fixture('corrupt_shapefile.zip')
      .pipe(decoder)
      .on('error', (err) => {
        expect(err.toJSON()).to.eql({
          error: {
            reason: 'corrupt_shapefile_error',
            english: 'Failed to read the shapefile: Error: unsupported shape type: 16473',
            params: {
              reason: 'Error: unsupported shape type: 16473'
            }
          }
        });
        onDone();
      })
      .pipe(es.mapSync(() => {}));
  });

  it('correctly reads .prj file for non epsg4326 features and populates the geojson feature with it', function(onDone) {
    var [decoder, res] = shpDecoder();
    fixture('simple_points_epsg_2834.zip')
      .pipe(decoder)
      .pipe(es.mapSync(function(feature) {
        var parsedCrs = srs.parse(feature.crs);
        expect(parsedCrs.valid).to.equal(true);
        expect(parsedCrs.proj4).to.equal("+proj=lcc +lat_1=41.7 +lat_2=40.43333333333333 +lat_0=39.66666666666666 +lon_0=-82.5 +x_0=600000 +y_0=0 +ellps=GRS80 +units=m +no_defs");
      })).on('end', onDone);
  });

  it('defaults to default projection when prj is not there', function(onDone) {
    var [decoder, res] = shpDecoder();
    fixture('simple_points_sans_prj.zip')
      .pipe(decoder)
      .pipe(es.mapSync(function(feature) {
        var parsedCrs = srs.parse(feature.crs);
        expect(parsedCrs.valid).to.equal(true);
        expect(parsedCrs.proj4).to.equal("+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs");
      })).on('end', onDone);
  });

  it('can deal with dates in a shapefile', function(onDone) {
    var [decoder, res] = shpDecoder();
    fixture('dates.zip')
      .pipe(decoder)
      .pipe(es.mapSync(function(feature) {
        var [date, gpsDate] = feature.columns.filter((c) => (c.name === '__gps_date') || (c.name === '__date'));
        //just check that the date is ISO8601 parsable
        expect(Date.parse(date.value).toString()).to.not.equal('Invalid Date');
        expect(Date.parse(gpsDate.value).toString()).to.not.equal('Invalid Date');
      })).on('end', onDone);
  });

  it('will emit an error for a missing DBF', function(onDone) {
    var [decoder, res] = shpDecoder();
    fixture('missing_dbf.zip')
      .pipe(decoder)
      .on('error', (err) => {
        expect(err.toJSON()).to.eql({
          error: {
            reason: 'incomplete_shapefile_error',
            english: 'Your shapefile archive is incomplete. It must contain a .dbf, .shp, and .prj file for every layer. Expected it to contain the following files, which were actually missing: SIGNIFICANT_ECOLOGICAL_AREA_(SEA).dbf.',
            params: {
              missing: ['SIGNIFICANT_ECOLOGICAL_AREA_(SEA).dbf']
            }
          }
        });
        onDone();
      }).pipe(new DevNull());
  });

  it('will emit an error for a missing SHP', function(onDone) {
    var [decoder, res] = shpDecoder();
    fixture('missing_shp.zip')
      .pipe(decoder)
      .on('error', (err) => {
        expect(err.toJSON()).to.eql({
          error: {
            reason: 'incomplete_shapefile_error',
            english: 'Your shapefile archive is incomplete. It must contain a .dbf, .shp, and .prj file for every layer. Expected it to contain the following files, which were actually missing: SIGNIFICANT_ECOLOGICAL_AREA_(SEA).shp.',
            params: {
              missing: ['SIGNIFICANT_ECOLOGICAL_AREA_(SEA).shp']
            }
          }
        });
        onDone();
      }).pipe(new DevNull());
  });

  it('can deal with corrupt hidden files', function(onDone) {
    this.timeout(4000);
    var [decoder, res] = shpDecoder();
    var count = 0;
    fixture('simple_points_hidden_garbage.zip')
      .pipe(decoder)
      .pipe(es.mapSync(() => count++))
      .on('end', () => {
        expect(count).to.equal(2);
        onDone();
      });
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
      .pipe(new ArityChecker())
      .pipe(es.mapSync(function(row) {
        let columns = row.columns;
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
      .pipe(new ArityChecker())
      .pipe(es.mapSync(function(row) {
        let columns = row.columns;
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
          "coordinates": [
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
    fixture('simple_polygons.zip')
      .pipe(decoder)
      .pipe(new ArityChecker())
      .pipe(es.mapSync(function(row) {
        let columns = row.columns;
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
      .pipe(new ArityChecker())
      .pipe(es.mapSync(function(row) {
        let columns = row.columns;
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
      .pipe(new ArityChecker())
      .pipe(es.mapSync(function(row) {
        let columns = row.columns;
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
      .pipe(new ArityChecker())
      .pipe(es.mapSync(function(row) {
        let columns = row.columns;
        expect(columns.map((c) => c.constructor.name)).to.eql([
          'SoQLMultiPolygon',
          'SoQLText'
        ]);
        expect(columns.map((c) => c.value)).to.eql(expectedValues[count]);
        count++;
      })).on('end', onDone);
  });
});