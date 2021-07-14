import _ from 'underscore';
import chai from 'chai';
import { fixture, bufferJs } from '../fixture.js';
import request from 'request';
import CoreMock from '../services/mock-core.js';
import MockZKClient from '../services/mock-zk.js';
import config from '../../es6-lib/config/index.js';
import service from '../../es6-lib/service.js';

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
