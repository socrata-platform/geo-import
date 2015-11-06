import chai from 'chai';
import should from 'should';
import * as es from 'event-stream';
import {
  fixture
}
from './fixture';
import KMZ from '../lib/decoders/kmz';
var expect = chai.expect;


describe('unit :: kmz decoder turns things into SoQLTypes', function() {
  it('can turn simple points to SoQLPoint', function(onDone) {
    var count = 0;

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
        false
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
        true
      ]
    ];

    fixture('simple_points.kmz')
      .pipe(new KMZ())
      .pipe(es.mapSync(function(thing) {
        let columns = thing.columns;

        expect(columns.map((c) => c.constructor.name)).to.eql([
          'SoQLPoint',
          'SoQLText',
          'SoQLNumber',
          'SoQLNumber',
          'SoQLBoolean'
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

    fixture('simple_lines.kmz')
      .pipe(new KMZ())
      .pipe(es.mapSync(function(thing) {
        let columns = thing.columns;
        expect(columns.map((c) => c.constructor.name)).to.eql([
          'SoQLLine',
          'SoQLText'
        ]);

        // console.log(columns.map((c) => c.value), expectedValues[count])
        expect(columns.map((c) => c.value)).to.eql(expectedValues[count]);

        count++;
      })).on('end', () => {
        expect(count).to.equal(2);
        onDone();
      });
  });

  it('can turn simple polys to SoQLPolygon', function(onDone) {
    var expectedValues = [
      [{
          "type": "Polygon",
          "coordinates": [
            [
              [100.0, 0.0],
              [101.0, 0.0],
              [101.0, 1.0],
              [100.0, 1.0],
              [100.0, 0.0]
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
        "first value"
      ],
      [{
          "type": "Polygon",
          "coordinates": [
            [
              [100.0, 0.0],
              [101.0, 0.0],
              [101.0, 1.0],
              [100.0, 1.0],
              [100.0, 0.0]
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
        "second value"
      ]
    ];


    var count = 0;
    fixture('simple_polygons.kmz')
      .pipe(new KMZ())
      .pipe(es.mapSync(function(thing) {
        let columns = thing.columns;
        expect(columns.map((c) => c.constructor.name)).to.eql([
          'SoQLPolygon',
          'SoQLText'
        ]);

        expect(columns.map((c) => c.value)).to.eql(expectedValues[count]);
        count++;
      })).on('end', onDone);
  });

  it('can turn simple points to SoQLMultiPoint', function(onDone) {
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
    fixture('simple_multipoints.kmz')
      .pipe(new KMZ())
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

  it('can turn simple points to SoQLMultiLine', function(onDone) {
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
    fixture('simple_multilines.kmz')
      .pipe(new KMZ())
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

  it('can turn simple points to SoQLMultiPolygon', function(onDone) {
    var expectedValues = [
      [{
          "type": "MultiPolygon",
          "coordinates": [
            [
              [
                [102.0, 2.0],
                [103.0, 2.0],
                [103.0, 3.0],
                [102.0, 3.0],
                [102.0, 2.0]
              ]
            ],
            [
              [
                [100.0, 0.0],
                [101.0, 0.0],
                [101.0, 1.0],
                [100.0, 1.0],
                [100.0, 0.0]
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
                [103.0, 2.0],
                [102.0, 2.0],
                [103.0, 3.0],
                [102.0, 3.0],
                [103.0, 2.0]
              ]
            ],
            [
              [
                [100.0, 0.0],
                [101.0, 0.0],
                [101.0, 1.0],
                [100.0, 1.0],
                [100.0, 0.0]
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
    fixture('simple_multipolygons.kmz')
      .pipe(new KMZ())
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