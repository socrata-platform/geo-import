import chai from 'chai';
import should from 'should';
import * as es from 'event-stream';
import {fixture} from './fixture';
import GeoJSON from '../lib/decoders/geojson';
var expect = chai.expect;

describe('unit :: geojson decoder turns things into SoQLTypes', function() {

  it('will emit an error for malformed json', function(onDone) {
    var count = 0;
    fixture('malformed_geojson.json')
    .pipe(new GeoJSON())
    .once('error', (err) => {
      console.log(err);
      onDone();
    })
  });


  it('can turn simple points to SoQLPoint', function(onDone) {
    var count = 0;
    fixture('simple_points.json')
    .pipe(new GeoJSON())
    .pipe(es.mapSync(function(thing) {
      let columns = thing.columns;
      expect(columns.map((c) => c.constructor.name)).to.eql([
        'SoQLPoint',
        'SoQLText',
        'SoQLNumber',
        'SoQLNumber',
        'SoQLBoolean'
      ])
      count++

    })).on('end', () => {
      expect(count).to.equal(2);
      onDone();
    })
  });

  it('can turn simple points to SoQLLine', function(onDone) {
    fixture('simple_lines.json')
    .pipe(new GeoJSON())
    .pipe(es.mapSync(function(thing) {
      let columns = thing.columns;
      expect(columns.map((c) => c.constructor.name)).to.eql([
        'SoQLLine',
        'SoQLText'
      ])

    })).on('end', onDone)
  });

  it('can turn simple points to SoQLPolygon', function(onDone) {
    fixture('simple_polygons.json')
    .pipe(new GeoJSON())
    .pipe(es.mapSync(function(thing) {
      let columns = thing.columns;
      expect(columns.map((c) => c.constructor.name)).to.eql([
        'SoQLPolygon',
        'SoQLText'
      ])

    })).on('end', onDone)
  });

  it('can turn simple points to SoQLMultiPoint', function(onDone) {
    var geoJson =

    fixture('simple_multipoints.json')
    .pipe(new GeoJSON())
    .pipe(es.mapSync(function(thing) {
      let columns = thing.columns;
      expect(columns.map((c) => c.constructor.name)).to.eql([
        'SoQLMultiPoint',
        'SoQLText'
      ])

    })).on('end', onDone)
  });

  it('can turn simple points to SoQLMultiLine', function(onDone) {
    fixture('simple_multilines.json')
    .pipe(new GeoJSON())
    .pipe(es.mapSync(function(thing) {
      let columns = thing.columns;
      expect(columns.map((c) => c.constructor.name)).to.eql([
        'SoQLMultiLine',
        'SoQLText'
      ])

    })).on('end', onDone)
  });

  it('can turn simple points to SoQLMultiPolygon', function(onDone) {
    fixture('simple_multipolygons.json')
    .pipe(new GeoJSON())
    .pipe(es.mapSync(function(thing) {
      let columns = thing.columns;
      expect(columns.map((c) => c.constructor.name)).to.eql([
        'SoQLMultiPolygon',
        'SoQLText'
      ])
    })).on('end', onDone)
  });

});
