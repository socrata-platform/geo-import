import chai from 'chai';
import should from 'should';
import * as es from 'event-stream';
import {
  fixture
}
from '../fixture';
import KML from '../../lib/decoders/kml';
var expect = chai.expect;


describe('kml decoder', function() {

  it('will emit an error for unparsable kml', function(onDone) {
    var count = 0;
    fixture('malformed_kml.kml')
      .pipe(new KML())
      .on('error', (err) => {
        expect(err.toString()).to.contain("XML Parse error");
        onDone();
      });
  });

  it('will make empty elements soql nulls', function(onDone) {
    var count = 0;
    fixture('with_nulls.kml')
      .pipe(new KML())
      .pipe(es.mapSync((row) => {
        var [theGeom] = row.columns;
        expect(theGeom.isCorrectArity()).to.equal(true);

        expect(row.columns.map((c) => c.constructor.name).sort()).to.eql([
          'SoQLPoint',
          'SoQLNull',
          'SoQLNull',
          'SoQLNull',
          'SoQLNull'
        ].sort());
      }))
      .on('end', onDone);
  });

  it('will guess number types in a reasonable way', function(onDone) {
    var count = 0;
    fixture('type_guessing.kml')
      .pipe(new KML())
      .pipe(es.mapSync((row) => {
        var [theGeom] = row.columns;
        expect(theGeom.isCorrectArity()).to.equal(true);

        expect(row.columns.map((c) => c.constructor.name).sort()).to.eql([
          'SoQLPoint',
          'SoQLText',
          'SoQLNumber',
          'SoQLNumber'
        ].sort());
      }))
      .on('end', onDone);
  });

  it('can turn untyped extendeddata to SoQLTypes', function(onDone) {
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
        "false"
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
        "true"
      ]
    ];

    var kml = new KML();
    var count = 0;

    fixture('untyped_simple_points.kml')
      .pipe(kml)
      .pipe(es.mapSync(function(row) {
        var [theGeom] = row.columns;
        expect(theGeom.isCorrectArity()).to.equal(true);

        let columns = row.columns;
        expect(columns.map((c) => c.constructor.name)).to.eql([
          'SoQLPoint',
          'SoQLText',
          'SoQLNumber',
          'SoQLNumber',
          'SoQLText'
        ]);

        expect(columns.map((c) => c.value)).to.eql(expectedValues[count]);
        count++;
      })).on('end', () => {
        expect(count).to.equal(2);
        onDone();
      });
  });

  it('can turn kml simple points to SoQLPoint', function(onDone) {
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

    var kml = new KML();
    var count = 0;

    fixture('simple_points.kml')
      .pipe(kml)
      .pipe(es.mapSync(function(row) {
        var [theGeom] = row.columns;
        expect(theGeom.isCorrectArity()).to.equal(true);

        let columns = row.columns;

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

  it('can turn kml simple lines to SoQLLine', function(onDone) {

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

    var kml = new KML();
    var count = 0;

    fixture('simple_lines.kml')
      .pipe(kml)
      .pipe(es.mapSync(function(row) {
        var [theGeom] = row.columns;
        expect(theGeom.isCorrectArity()).to.equal(true);

        let columns = row.columns;
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

  it('can turn kml simple polys to SoQLPolygon', function(onDone) {
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


    var kml = new KML();
    var count = 0;
    fixture('simple_polygons.kml')
      .pipe(kml)
      .pipe(es.mapSync(function(row) {
        var [theGeom] = row.columns;
        expect(theGeom.isCorrectArity()).to.equal(true);

        let columns = row.columns;
        expect(columns.map((c) => c.constructor.name)).to.eql([
          'SoQLPolygon',
          'SoQLText'
        ]);

        expect(columns.map((c) => c.value)).to.eql(expectedValues[count]);
        count++;
      })).on('end', onDone);
  });

  it('can turn kml simple multipoints to SoQLMultiPoint', function(onDone) {
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

    var kml = new KML();
    var count = 0;
    fixture('simple_multipoints.kml')
      .pipe(kml)
      .pipe(es.mapSync(function(row) {
        var [theGeom] = row.columns;
        expect(theGeom.isCorrectArity()).to.equal(true);

        let columns = row.columns;
        expect(columns.map((c) => c.constructor.name)).to.eql([
          'SoQLMultiPoint',
          'SoQLText'
        ]);
        expect(columns.map((c) => c.value)).to.eql(expectedValues[count]);
        count++;
      })).on('end', onDone);
  });

  it('can turn kml simple multilines to SoQLMultiLine', function(onDone) {
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

    var kml = new KML();
    var count = 0;
    fixture('simple_multilines.kml')
      .pipe(kml)
      .pipe(es.mapSync(function(row) {
        var [theGeom] = row.columns;
        expect(theGeom.isCorrectArity()).to.equal(true);

        let columns = row.columns;
        expect(columns.map((c) => c.constructor.name)).to.eql([
          'SoQLMultiLine',
          'SoQLText'
        ]);

        expect(columns.map((c) => c.value)).to.eql(expectedValues[count]);
        count++;
      })).on('end', onDone);
  });

  it('can turn kml simple multipolys to SoQLMultiPolygon', function(onDone) {
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

    var kml = new KML();
    var count = 0;
    fixture('simple_multipolygons.kml')
      .pipe(kml)
      .pipe(es.mapSync(function(row) {
        var [theGeom] = row.columns;
        expect(theGeom.isCorrectArity()).to.equal(true);

        let columns = row.columns;
        expect(columns.map((c) => c.constructor.name)).to.eql([
          'SoQLMultiPolygon',
          'SoQLText'
        ]);

        expect(columns.map((c) => c.value)).to.eql(expectedValues[count]);
        count++;

      })).on('end', onDone);
  });


  it('can turn kml multi geometry heterogenous shapes into SoQL', function(onDone) {

    var kml = new KML();
    var rows = [];

    var pointExpected = [{
        "type": "MultiPoint",
        "coordinates": [
          [
            102.0,
            0.5
          ]
        ]
      },
      "first value"
    ];


    var lineExpected = [{
        "type": "MultiLineString",
        "coordinates": [
          [
            [101.0, 0.0],
            [101.0, 1.0]
          ]
        ]
      },
      "first value"
    ];

    fixture('points_and_lines_multigeom.kml')
      .pipe(kml)
      .pipe(es.mapSync((row) => {
        var [theGeom] = row.columns;
        expect(theGeom.isCorrectArity()).to.equal(true);

        rows.push(row);
      }))
      .on('end', () => {
        var [t0, t1] = rows;

        expect(t0.columns.map((c) => c.value)).to.eql(pointExpected);
        expect(t1.columns.map((c) => c.value)).to.eql(lineExpected);

        onDone();
      });
  });


  it('can turn kml multi geometry heterogenous shapes into SoQL', function(onDone) {

    var kml = new KML();
    var rows = [];

    var pointExpected = [{
        "type": "MultiPoint",
        "coordinates": [
          [
            102.0,
            0.5
          ]
        ]
      },
      "first value"
    ];


    var lineExpected = [{
        "type": "MultiLineString",
        "coordinates": [
          [
            [101.0, 0.0],
            [101.0, 1.0]
          ]
        ]
      },
      "first value"
    ];

    fixture('points_and_lines_multigeom_sans_schema.kml')
      .pipe(kml)
      .pipe(es.mapSync((row) => {
        var [theGeom] = row.columns;
        expect(theGeom.isCorrectArity()).to.equal(true);

        rows.push(row);
      }))
      .on('end', () => {
        var [t0, t1] = rows;

        expect(t0.columns.map((c) => c.value)).to.eql(pointExpected);
        expect(t1.columns.map((c) => c.value)).to.eql(lineExpected);

        onDone();
      });
  });
});