import chai from 'chai';
import should from 'should';
import * as es from 'event-stream';
import {
  fixture
}
from '../fixture';
import GeoJSON from '../../lib/decoders/geojson';
var expect = chai.expect;

describe('geometry transforms', function() {

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