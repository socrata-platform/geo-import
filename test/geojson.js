import chai from 'chai';
import should from 'should';
import * as es from 'event-stream';
import {fixture} from './fixture';
import GeoJSON from '../lib/decoders/geojson';
var expect = chai.expect;

describe('unit :: geojson decoder turns things into SoQLTypes', function() {
  it('can turn simple points to SoQLPoint', function(onDone) {
    var geoJson = new GeoJSON()

    geoJson.toFeatures(fixture('simple_points.json'))
    .pipe(es.mapSync(function(thing) {
      let columns = thing.columns;
      expect(columns.map((c) => c.constructor.name)).to.eql([
        'SoQLPoint',
        'SoQLText',
        'SoQLNumber',
        'SoQLNumber',
        'SoQLBoolean'
      ])

    })).on('end', onDone)

  });
  it('can turn simple points to SoQLLine', function(onDone) {
    var geoJson = new GeoJSON()

    geoJson.toFeatures(fixture('simple_lines.json'))
    .pipe(es.mapSync(function(thing) {
      let columns = thing.columns;
      expect(columns.map((c) => c.constructor.name)).to.eql([
        'SoQLLine',
        'SoQLText'
      ])

    })).on('end', onDone)

  });
  it('can turn simple points to SoQLPolygon', function(onDone) {
    var geoJson = new GeoJSON()

    geoJson.toFeatures(fixture('simple_polygons.json'))
    .pipe(es.mapSync(function(thing) {
      let columns = thing.columns;
      expect(columns.map((c) => c.constructor.name)).to.eql([
        'SoQLPolygon',
        'SoQLText'
      ])

    })).on('end', onDone)

  });
  it('can turn simple points to SoQLMultiPoint', function(onDone) {
    var geoJson = new GeoJSON()

    geoJson.toFeatures(fixture('simple_multipoints.json'))
    .pipe(es.mapSync(function(thing) {
      let columns = thing.columns;
      expect(columns.map((c) => c.constructor.name)).to.eql([
        'SoQLMultiPoint',
        'SoQLText'
      ])

    })).on('end', onDone)

  });
  it('can turn simple points to SoQLMultiLine', function(onDone) {
    var geoJson = new GeoJSON()

    geoJson.toFeatures(fixture('simple_multilines.json'))
    .pipe(es.mapSync(function(thing) {
      let columns = thing.columns;
      expect(columns.map((c) => c.constructor.name)).to.eql([
        'SoQLMultiLine',
        'SoQLText'
      ])

    })).on('end', onDone)

  });
  it('can turn simple points to SoQLMultiPolygon', function(onDone) {
    var geoJson = new GeoJSON()

    geoJson.toFeatures(fixture('simple_multipolygons.json'))
    .pipe(es.mapSync(function(thing) {
      let columns = thing.columns;
      expect(columns.map((c) => c.constructor.name)).to.eql([
        'SoQLMultiPolygon',
        'SoQLText'
      ])

    })).on('end', onDone)

  });
});
