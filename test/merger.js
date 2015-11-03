
import chai from 'chai';
import should from 'should';
import * as es from 'event-stream';
import {fixture} from './fixture';
var expect = chai.expect;


var SoQLPoint = require('../lib/soql/point'),
  SoQLLine = require('../lib/soql/line'),
  SoQLPolygon = require('../lib/soql/polygon'),
  SoQLMultiPoint = require('../lib/soql/multipoint'),
  SoQLMultiLine = require('../lib/soql/multiline'),
  SoQLMultiPolygon = require('../lib/soql/multipolygon');

var SoQLText = require('../lib/soql/text'),
  SoQLBoolean = require('../lib/soql/boolean'),
  SoQLNumber = require('../lib/soql/number'),
  SoQLArray = require('../lib/soql/array'),
  SoQLObject = require('../lib/soql/object');



var GeoJSON = require('../lib/decoders/geojson');
var merger = require('../lib/decoders/merger');

describe('unit :: merging features to layers', function() {
  it('soql mapping :: homogenous points, default crs', function(onDone) {
    var geoJson = new GeoJSON();
    merger.toLayers(geoJson.toFeatures(fixture('simple_points.json')), function(err, layers) {

      expect(layers.length).to.equal(1);

      var [layer] = layers;

      expect(layer.columns.map(c => [c.name, c.ctype])).to.eql([
        ['the_geom', 'point'],
        ['a_string', 'string'],
        ['a_num', 'number'],
        ['a_float', 'number'],
        ['a_bool', 'boolean']
      ])


      var features = [];
      layer.read().pipe(es.mapSync(function(row, i) {
        features.push(row);
      })).on('end', function() {
        var [f0, f1] = features;

        expect(f0).to.eql([
          new SoQLPoint('the_geom', {coordinates: [102, 0.5]}),
          new SoQLText('a_string', 'first value'),
          new SoQLNumber('a_num', 2),
          new SoQLNumber('a_float', 2.2),
          new SoQLBoolean('a_bool', false),
        ]);

        expect(f1).to.eql([
          new SoQLPoint('the_geom', {coordinates: [103, 1.5]}),
          new SoQLText('a_string', 'second value'),
          new SoQLNumber('a_num', 2),
          new SoQLNumber('a_float', 2.2),
          new SoQLBoolean('a_bool', true),
        ]);

        onDone();
      });
    });
  });

  it('soql mapping :: homogenous points, heterogenous crs', function(onDone) {


    var geoJson = new GeoJSON();
    merger.toLayers(geoJson.toFeatures(fixture('multi_crs.json')), function(err, layers) {

      expect(layers.length).to.equal(1);

      var [layer] = layers;

      expect(layer.columns.map(c => [c.name, c.ctype])).to.eql([
        ['the_geom', 'point'],
        ['a_string', 'string'],
        ['a_num', 'number'],
        ['a_float', 'number'],
        ['a_bool', 'boolean']
      ])


      var features = [];
      layer.read().pipe(es.mapSync(function(row, i) {
        features.push(row);
      })).on('end', function() {
        var [f0, f1] = features;

        var theGeom = f0[0];
        theGeom.value.coordinates[0].should.be.approximately(-97.48, .01)
        theGeom.value.coordinates[1].should.be.approximately(.000004, .01)


        expect(f0.slice(1)).to.eql([
          new SoQLText('a_string', 'first value'),
          new SoQLNumber('a_num', 2),
          new SoQLNumber('a_float', 2.2),
          new SoQLBoolean('a_bool', false),
        ]);

        expect(f1).to.eql([
          new SoQLPoint('the_geom', {coordinates: [103, 1.5]}),
          new SoQLText('a_string', 'second value'),
          new SoQLNumber('a_num', 2),
          new SoQLNumber('a_float', 2.2),
          new SoQLBoolean('a_bool', true),
        ]);

        onDone();
      });
    });
  });

  it('soql mapping :: homogenous points, heterogenous non wgs84 crs', function(onDone) {


    var geoJson = new GeoJSON();
    merger.toLayers(geoJson.toFeatures(fixture('multi_non_wgs84.json')), function(err, layers) {

      expect(layers.length).to.equal(1);

      var [layer] = layers;

      expect(layer.columns.map(c => [c.name, c.ctype])).to.eql([
        ['the_geom', 'point'],
        ['a_string', 'string'],
        ['a_num', 'number'],
        ['a_float', 'number'],
        ['a_bool', 'boolean']
      ])


      var features = [];
      layer.read().pipe(es.mapSync(function(row, i) {
        features.push(row);
      })).on('end', function() {
        var [f0, f1] = features;

        var l0Geom = f0[0];
        l0Geom.value.coordinates[0].should.be.approximately(-97.48, .01)
        l0Geom.value.coordinates[1].should.be.approximately(.000004, .01)


        expect(f0.slice(1)).to.eql([
          new SoQLText('a_string', 'first value'),
          new SoQLNumber('a_num', 2),
          new SoQLNumber('a_float', 2.2),
          new SoQLBoolean('a_bool', false),
        ]);

        var l1Geom = f1[0];
        l1Geom.value.coordinates[0].should.be.approximately(10.78, .01)
        l1Geom.value.coordinates[1].should.be.approximately(45.03, .01)

        expect(f1.slice(1)).to.eql([
          new SoQLText('a_string', 'second value'),
          new SoQLNumber('a_num', 2),
          new SoQLNumber('a_float', 2.2),
          new SoQLBoolean('a_bool', true),
        ]);

        onDone();
      });
    });
  });
});