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
          projection: 'PROJCS[\"WGS 84 / Pseudo-Mercator\",\n    GEOGCS[\"WGS 84\",\n        DATUM[\"WGS_1984\",\n            SPHEROID[\"WGS 84\",6378137,298.257223563,\n                AUTHORITY[\"EPSG\",\"7030\"]],\n            AUTHORITY[\"EPSG\",\"6326\"]],\n        PRIMEM[\"Greenwich\",0,\n            AUTHORITY[\"EPSG\",\"8901\"]],\n        UNIT[\"degree\",0.0174532925199433,\n            AUTHORITY[\"EPSG\",\"9122\"]],\n        AUTHORITY[\"EPSG\",\"4326\"]],\n    UNIT[\"metre\",1,\n        AUTHORITY[\"EPSG\",\"9001\"]],\n    PROJECTION[\"Mercator_1SP\"],\n    PARAMETER[\"central_meridian\",0],\n    PARAMETER[\"scale_factor\",1],\n    PARAMETER[\"false_easting\",0],\n    PARAMETER[\"false_northing\",0],\n    EXTENSION[\"PROJ4\",\"+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0.0 +k=1.0 +units=m +nadgrids=@null +wktext +no_defs +over\"],\n    AUTHORITY[\"EPSG\",\"3857\"],\n    AXIS[\"X\",EAST],\n    AXIS[\"Y\",NORTH]]',
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