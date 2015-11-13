import _ from 'underscore';
import chai from 'chai';
import should from 'should';
import * as es from 'event-stream';
import {
  fixture, bufferJs
}
from './fixture';
import request from 'request';
import MockZKClient from './services/mock-zk';
import {
  EventEmitter
}
from 'events';
import config from '../lib/config';
import service from '../lib/service';

var expect = chai.expect;

describe('unit :: summary service', () => {
  var app;
  var port = config().port;
  var url = `http://localhost:${port}`;
  var corePort = 7000;

  beforeEach((onDone) => {
    var zk = new MockZKClient(corePort);
    service(zk, {}, (a, zk) => {
      app = a;
      onDone();
    });
  });

  afterEach(() => app.close());

  it('can post single layer geojson and it will make a summary', (onDone) => {
    bufferJs(fixture('simple_points.json')
      .pipe(request.post({
        url: url + '/summary',
        headers: {
          'Authorization': 'test-auth',
          'X-App-Token': 'app-token',
          'X-Socrata-Host': 'localhost:6668',
          'Content-Type': 'application/json'
        }
      })), (res, buffered) => {
        expect(res.statusCode).to.equal(200);
        expect(res.headers['content-type']).to.contain('application/json');
        var [layer] = buffered.layers;
        expect(layer.count).to.equal(2);
        expect(layer.projection).to.equal('GEOGCS["WGS 84",\n    DATUM["WGS_1984",\n        SPHEROID["WGS 84",6378137,298.257223563,\n            AUTHORITY["EPSG","7030"]],\n        TOWGS84[0,0,0,0,0,0,0],\n        AUTHORITY["EPSG","6326"]],\n    PRIMEM["Greenwich",0,\n        AUTHORITY["EPSG","8901"]],\n    UNIT["degree",0.0174532925199433,\n        AUTHORITY["EPSG","9108"]],\n    AUTHORITY["EPSG","4326"]]');
        expect(layer.name).to.equal('layer_0');
        onDone();
      });
  });

  it('can post multi layer geojson and it will make a summary', (onDone) => {
    bufferJs(fixture('points_and_lines.json')
      .pipe(request.post({
        url: url + '/summary',
        headers: {
          'Authorization': 'test-auth',
          'X-App-Token': 'app-token',
          'X-Socrata-Host': 'localhost:6668',
          'Content-Type': 'application/json'
        }
      })), (res, buffered) => {
        expect(res.statusCode).to.equal(200);
        expect(res.headers['content-type']).to.contain('application/json');
        var [l0, l1] = buffered.layers;
        expect(l0.count).to.equal(1);
        expect(l0.projection).to.contain('26915');
        expect(l0.name).to.equal('layer_0');
        expect(l0.geometry).to.equal('line');

        expect(l0.bbox).to.eql({
          minx: null,
          miny: null,
          maxx: null,
          maxy: null
        });

        expect(l1.count).to.equal(1);
        expect(l1.projection).to.contain('26915');
        expect(l1.name).to.equal('layer_1');
        expect(l1.geometry).to.equal('point');

        expect(l1.bbox).to.eql({
          minx: null,
          miny: null,
          maxx: null,
          maxy: null
        });

        onDone();
      });
  });


});