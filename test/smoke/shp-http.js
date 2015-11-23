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



describe('shapefile ingress', () => {
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


  it('should be able to do a ~12mb SHP summary', function(onDone) {
    this.timeout(80000);

    bufferJs(fixture('smoke/USBR_crs.zip')
      .pipe(request.post({
        url: url + '/summary',
        encoding: null,
        headers: {
          'Authorization': 'test-auth',
          'X-App-Token': 'app-token',
          'X-Socrata-Host': 'localhost:6668',
          'Content-Type': 'application/zip'
        }
      })), (res, buffered) => {
        expect(res.statusCode).to.equal(200);

        expect(buffered.layers.length).to.equal(2);
        var [l0, l1] = buffered.layers;

        expect(l0).to.eql({
          count: 3,
          projection: 'GEOGCS["WGS 84",\n    DATUM["WGS_1984",\n        SPHEROID["WGS 84",6378137,298.257223563,\n            AUTHORITY["EPSG","7030"]],\n        TOWGS84[0,0,0,0,0,0,0],\n        AUTHORITY["EPSG","6326"]],\n    PRIMEM["Greenwich",0,\n        AUTHORITY["EPSG","8901"]],\n    UNIT["degree",0.0174532925199433,\n        AUTHORITY["EPSG","9108"]],\n    AUTHORITY["EPSG","4326"]]',
          name: 'layer_0',
          geometry: 'multipolygon',
          bbox: {
            minx: null,
            miny: null,
            maxx: null,
            maxy: null
          },
          columns: [{
            fieldName: 'the_geom',
            dataTypeName: 'multipolygon'
          }, {
            fieldName: 'objectid',
            dataTypeName: 'number'
          }, {
            fieldName: 'region',
            dataTypeName: 'text'
          }, {
            fieldName: 'name',
            dataTypeName: 'text'
          }]
        });

        expect(l1).to.eql({
          count: 2,
          projection: 'GEOGCS["WGS 84",\n    DATUM["WGS_1984",\n        SPHEROID["WGS 84",6378137,298.257223563,\n            AUTHORITY["EPSG","7030"]],\n        TOWGS84[0,0,0,0,0,0,0],\n        AUTHORITY["EPSG","6326"]],\n    PRIMEM["Greenwich",0,\n        AUTHORITY["EPSG","8901"]],\n    UNIT["degree",0.0174532925199433,\n        AUTHORITY["EPSG","9108"]],\n    AUTHORITY["EPSG","4326"]]',
          name: 'layer_1',
          geometry: 'polygon',
          bbox: {
            minx: null,
            miny: null,
            maxx: null,
            maxy: null
          },
          columns: [{
            fieldName: 'the_geom',
            dataTypeName: 'polygon'
          }, {
            fieldName: 'objectid',
            dataTypeName: 'number'
          }, {
            fieldName: 'region',
            dataTypeName: 'text'
          }, {
            fieldName: 'name',
            dataTypeName: 'text'
          }]
        });

        onDone();
      });
  });



});