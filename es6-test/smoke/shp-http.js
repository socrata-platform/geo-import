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

  beforeEach(function(onDone) {
    //for jankins
    this.timeout(6000);

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

  it('should be able to deal with a mostly null SHP', function(onDone) {
    this.timeout(80000);

    bufferJs(fixture('smoke/CATCH_BASIN_LEAD_POLY.zip')
      .pipe(request.post({
        url: url + '/spatial',
        encoding: null,
        headers: {
          'Authorization': 'test-auth',
          'X-App-Token': 'app-token',
          'X-Socrata-Host': 'localhost:6668',
          'Content-Type': 'application/zip'
        }
      })), (res, buffered) => {
        expect(res.statusCode).to.equal(200);
        buffered.bbox.minx.should.be.approximately(-113.71250, .0001);
        buffered.bbox.miny.should.be.approximately(53.39732, .0001);
        buffered.bbox.maxx.should.be.approximately(-113.29525, .0001);
        buffered.bbox.maxy.should.be.approximately(53.65448, .0001);
        expect(buffered.layers.length).to.equal(1)

        expect(buffered.layers[0].layer.columns).to.eql([{
          fieldName: 'the_geom',
          name: 'the_geom',
          dataTypeName: 'line'
        }, {
          fieldName: 'facility',
          name: 'FACILITY',
          dataTypeName: 'text'
        }, {
          fieldName: 'type',
          name: 'TYPE',
          dataTypeName: 'text'
        }, {
          fieldName: 'year_const',
          name: 'YEAR_CONST',
          dataTypeName: 'number'
        }, {
          fieldName: 'nghbrhd',
          name: 'NGHBRHD',
          dataTypeName: 'text'
        }, {
          fieldName: 'nghbrhd_id',
          name: 'NGHBRHD_ID',
          dataTypeName: 'text'
        }, {
          fieldName: 'ward',
          name: 'WARD',
          dataTypeName: 'text'
        }, {
          fieldName: 'str_ave',
          name: 'STR_AVE',
          dataTypeName: 'text'
        }])
        onDone();
      });
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

        expect(buffered.layers.length).to.equal(1);
        var [l0] = buffered.layers;

        expect(l0).to.eql({
          count: 0,
          projection: 'Google Maps Global Mercator',
          name: 'USBR_RegionalBoundaries',
          geometry: null,
          bbox: {
            minx: null,
            miny: null,
            maxx: null,
            maxy: null
          },
          columns: []
        });

        onDone();
      });
  });


  it('missing files with garbage included SHP summary', function(onDone) {
    this.timeout(80000);

    bufferJs(fixture('smoke/wards-chicago.zip')
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
        expect(buffered.layers.length).to.equal(1);
        onDone();
      });
  });

});