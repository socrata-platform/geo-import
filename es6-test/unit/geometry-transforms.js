import chai from 'chai';
import should from 'should';
import es from 'event-stream';
import { fixture } from '../fixture';
import GeoJSON from '../../es6-lib/decoders/geojson';
var expect = chai.expect;

describe('geometry transforms', function() {

  it('can linify a line which is just a point', function(onDone) {
    fixture('non-line-lines.json')
      .pipe(new GeoJSON())
      .pipe(es.mapSync(function(row) {
        var line = row.columns[0].fixSemantics();
        expect(line.value.coordinates).to.eql([
          [100.0, 0.0],
          [100.0, 0.0]
        ]);
      }))
      .on('end', onDone);
  });

  it('can linify a multiline which is just a point', function(onDone) {
    fixture('non-line-multiline.json')
      .pipe(new GeoJSON())
      .pipe(es.mapSync(function(row) {
        var line = row.columns[0].fixSemantics();
        expect(line.value.coordinates).to.eql([[
          [100.0, 0.0],
          [100.0, 0.0]
        ]]);
      }))
      .on('end', onDone);
  });

  it('can close an unclosed polygon', function(onDone) {
    var geoms = [];
    fixture('unclosed_polygons.json')
      .pipe(new GeoJSON())
      .pipe(es.mapSync(function(thing) {
        var [geom, _other] = thing.columns;
        geoms.push(geom.fixSemantics());
      }))
      .on('end', () => {

        var [geom0, geom1] = geoms;
        expect(geom0.value.coordinates).to.eql([
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
        ]);

        expect(geom1.value.coordinates).to.eql([
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
            [100.2, 0.2],
            [100.2, 0.2]
          ]
        ]);

        onDone();
      });
  });

  it('can close an unclosed multipolygon', function(onDone) {
    var geoms = [];
    fixture('unclosed_multipolygons.json')
      .pipe(new GeoJSON())
      .pipe(es.mapSync(function(thing) {
        var [geom, _other] = thing.columns;
        geoms.push(geom.fixSemantics());
      }))
      .on('end', () => {

        var [geom0, geom1] = geoms;
        expect(geom0.value.coordinates).to.eql(
          [
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
                [100.0, 0.0],

              ],
              [
                [100.2, 0.2],
                [100.8, 0.2],
                [100.8, 0.8],
                [100.2, 0.8],
                [100.2, 0.0],
                [100.2, 0.2],
              ]
            ]
          ]);

        expect(geom1.value.coordinates).to.eql([
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
              [100.0, 0.0],
              [0.0, 0.0],
              [100.0, 0.0],

            ],
            [
              [100.2, 0.2],
              [100.2, 0.2],
              [100.2, 0.2],
              [100.2, 0.2]
            ]
          ]
        ]);
        onDone();
      });
  });
});
