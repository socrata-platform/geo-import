import _ from 'underscore';
import chai from 'chai';
import should from 'should';
import * as es from 'event-stream';
import {
  fixture, bufferJs
}
from '../fixture';
import request from 'request';
import CoreMock from '../services/mock-core';
import MockZKClient from '../services/mock-zk';
import {
  EventEmitter
}
from 'events';
import config from '../../lib/config';
import service from '../../lib/service';

var res;
var expect = chai.expect;


describe('kml ingress', () => {
  var mockZk;
  var mockCore;
  var conf = config();
  var corePort = 7002; //coreport
  var url = `http://localhost:${conf.port}`;
  var app;

  beforeEach((onDone) => {
    mockZk = new MockZKClient(corePort);
    service(mockZk, {}, (a, zk) => {
      app = a;
      mockCore = new CoreMock(corePort);
      onDone();
    });
  });

  afterEach(function() {
    mockCore.close();
    app.close();
  });


  it('should be able to do a ~30mb KML summary', function(onDone) {
    this.timeout(150000);

    bufferJs(fixture('smoke/usbr.kml')
      .pipe(request.post({
        url: url + '/summary',
        headers: {
          'Authorization': 'test-auth',
          'X-App-Token': 'app-token',
          'X-Socrata-Host': 'localhost:6668',
          'Content-Type': 'application/vnd.google-earth.kml+xml'
        }
      })), (res, buffered) => {
        expect(res.statusCode).to.equal(200);

        expect(buffered.layers).to.eql([]);


        // //the bbox is only populated when reading out from disk and reprojecting
        // //which doesn't happen on a summary, so bbox needs to be all nulls
        // expect(l0).to.eql({
        //   count: 5,
        //   projection: 'GEOGCS["WGS 84",\n    DATUM["WGS_1984",\n        SPHEROID["WGS 84",6378137,298.257223563,\n            AUTHORITY["EPSG","7030"]],\n        TOWGS84[0,0,0,0,0,0,0],\n        AUTHORITY["EPSG","6326"]],\n    PRIMEM["Greenwich",0,\n        AUTHORITY["EPSG","8901"]],\n    UNIT["degree",0.0174532925199433,\n        AUTHORITY["EPSG","9108"]],\n    AUTHORITY["EPSG","4326"]]',
        //   name: 'layer_0',
        //   geometry: 'multipolygon',
        //   bbox: {
        //     minx: null,
        //     miny: null,
        //     maxx: null,
        //     maxy: null
        //   },
        //   columns: [{
        //     fieldName: 'the_geom',
        //     name: 'the_geom',
        //     dataTypeName: 'multipolygon'
        //   }, {
        //     fieldName: 'objectid',
        //     name: 'objectid',
        //     dataTypeName: 'text'
        //   }, {
        //     fieldName: 'region',
        //     name: 'region',
        //     dataTypeName: 'text'
        //   }, {
        //     fieldName: 'name',
        //     name: 'name',
        //     dataTypeName: 'text'
        //   }]
        // });

        onDone();
      });
  });

  it('should be able to do a ~30mb KML upsert', function(onDone) {
    this.timeout(150000);
    bufferJs(fixture('smoke/usbr.kml')
      .pipe(request.post({
        url: url + '/spatial',
        headers: {
          'Authorization': 'test-auth',
          'X-App-Token': 'app-token',
          'X-Socrata-Host': 'localhost:6668',
          'Content-Type': 'application/vnd.google-earth.kml+xml'
        }
      })), (res, buffered) => {
        expect(res.statusCode).to.equal(200);

        expect(buffered.layers[0].layer.count).to.equal(5);

        //the bbox is only populated on reading out from disk, which needs
        //to happen for an upsert, so this is a reasonable smoketest
        var {
          maxx: maxx,
          maxy: maxy,
          minx: minx,
          miny: miny
        } = buffered.bbox;
        maxx.should.be.approximately(-93.50813092109847, 0.00001);
        maxy.should.be.approximately(49.002493028983906, 0.00001);
        minx.should.be.approximately(-124.73317395017921, 0.00001);
        miny.should.be.approximately(25.850648582704334, 0.00001);


        onDone();
      });
  });

  it('should be able to do la bikelanes KML upsert', function(onDone) {
    //long timeout for jankins
    this.timeout(45000);
    bufferJs(fixture('smoke/la_bikelanes.kml')
      .pipe(request.post({
        url: url + '/spatial',
        headers: {
          'Authorization': 'test-auth',
          'X-App-Token': 'app-token',
          'X-Socrata-Host': 'localhost:6668',
          'Content-Type': 'application/vnd.google-earth.kml+xml'
        }
      })), (res, buffered) => {
        expect(res.statusCode).to.equal(200);
        expect(buffered.layers.length).to.equal(4);
        onDone();
      });
  });

  it('should be able to do la bikelanes KML upsert', function(onDone) {
    //long timeout for jankins
    this.timeout(10000);
    bufferJs(fixture('smoke/cgis-en-6393.kml')
      .pipe(request.post({
        url: url + '/spatial',
        headers: {
          'Authorization': 'test-auth',
          'X-App-Token': 'app-token',
          'X-Socrata-Host': 'localhost:6668',
          'Content-Type': 'application/vnd.google-earth.kml+xml'
        }
      })), (res, buffered) => {
        expect(res.statusCode).to.equal(200);
        expect(buffered.layers.length).to.equal(2);
        var [{layer: {columns: cols0}}, {layer: {columns: cols1}}] = buffered.layers

        expect(cols0).to.eql([
          {fieldName: 'the_geom', name: 'the_geom', dataTypeName: 'point'},
          {fieldName: 'name', name: 'name', dataTypeName: 'text'},
          {fieldName: 'description', name: 'description', dataTypeName: 'text'},
          {fieldName: '__address', name: 'ADDRESS', dataTypeName: 'text'},
          {fieldName: '__type', name: 'TYPE', dataTypeName: 'text'},
          {fieldName: '__name', name: 'NAME', dataTypeName: 'text'},
          {fieldName: '__created_dt', name: 'CREATED_DT', dataTypeName: 'text'},
          {fieldName: '__comm_code', name: 'COMM_CODE', dataTypeName: 'text' }])

        expect(cols1).to.eql([
          {fieldName: 'the_geom', name: 'the_geom', dataTypeName: 'point' },
          {fieldName: 'name', name: 'name', dataTypeName: 'text' },
          {fieldName: 'description', name: 'description', dataTypeName: 'text' },
          {fieldName: '__address', name: 'ADDRESS', dataTypeName: 'text' },
          {fieldName: '__type', name: 'TYPE', dataTypeName: 'text' },
          {fieldName: '__name', name: 'NAME', dataTypeName: 'text' },
          {fieldName: '__created_dt', name: 'CREATED_DT', dataTypeName: 'text' }])

        onDone();
      });
  });


});