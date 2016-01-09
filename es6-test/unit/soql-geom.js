import chai from 'chai';
import should from 'should';
import * as es from 'event-stream';
import {fixture} from '../fixture';
import GeoJSON from '../../lib/decoders/geojson';

var expect = chai.expect;

describe('soql geometries', function() {

  it('count the vertices of a point', function(done) {
    var points = [];
    fixture('simple_points.json')
      .pipe(new GeoJSON())
      .pipe(es.mapSync(function(thing) {
        points.push(thing.columns[0]);
      })).on('end', () => {
        var counts = points.map((p) => p.vertexCount);
        expect(counts).to.eql([1, 1]);
        done();
      });
  });

  it('count the vertices of a line', function(done) {
    var points = [];
    fixture('simple_lines.json')
      .pipe(new GeoJSON())
      .pipe(es.mapSync(function(thing) {
        points.push(thing.columns[0]);
      })).on('end', () => {
        var counts = points.map((p) => p.vertexCount);
        expect(counts).to.eql([2, 2]);
        done();
      });
  });

  it('count the vertices of a polygon', function(done) {
    var points = [];
    fixture('simple_polygons.json')
      .pipe(new GeoJSON())
      .pipe(es.mapSync(function(thing) {
        points.push(thing.columns[0]);
      })).on('end', () => {
        var counts = points.map((p) => p.vertexCount);
        expect(counts).to.eql([10, 10]);
        done();
      });
  });

  it('count the vertices of a multipoint', function(done) {
    var points = [];
    fixture('simple_multipoints.json')
      .pipe(new GeoJSON())
      .pipe(es.mapSync(function(thing) {
        points.push(thing.columns[0]);
      })).on('end', () => {
        var counts = points.map((p) => p.vertexCount);
        expect(counts).to.eql([2, 2]);
        done();
      });
  });

  it('count the vertices of a multiline', function(done) {
    var points = [];
    fixture('simple_multilines.json')
      .pipe(new GeoJSON())
      .pipe(es.mapSync(function(thing) {
        points.push(thing.columns[0]);
      })).on('end', () => {
        var counts = points.map((p) => p.vertexCount);
        expect(counts).to.eql([4, 4]);
        done();
      });
  });

  it('count the vertices of a multipolygon', function(done) {
    var points = [];
    fixture('simple_multipolygons.json')
      .pipe(new GeoJSON())
      .pipe(es.mapSync(function(thing) {
        points.push(thing.columns[0]);
      })).on('end', () => {
        var counts = points.map((p) => p.vertexCount);
        expect(counts).to.eql([15, 15]);
        done();
      });
  });

});