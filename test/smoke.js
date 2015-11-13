import _ from 'underscore';
import chai from 'chai';
import should from 'should';
import * as es from 'event-stream';
import {
  fixture, bufferJs
}
from './fixture';
import request from 'request';
import CoreMock from './services/mock-core';
import MockZKClient from './services/mock-zk';
import {
  EventEmitter
}
from 'events';
import config from '../lib/config';
import service from '../lib/service';

var expect = chai.expect;

describe('smoke', function() {
  var app;
  var mockZk;
  var mockCore;
  var port = config().port;
  var url = `http://localhost:${port}`;

  before(function(onDone) {
    service({
      zkClient: MockZKClient
    }, (a, zk) => {
      mockZk = zk;
      app = a;
      mockCore = new CoreMock(mockZk.corePort);
      onDone();
    });
  });

  after(function(onDone) {
    try {
      mockCore.close();
      app.close();

    } catch (e) {
      console.error(e);
    }
  });


  it('can post a ~30mb KML USBR dataset', function(onDone) {
    this.timeout(30000);
    bufferJs(fixture('smoke/usbr.kml')
      .pipe(request.post({
        url: url + '/spatial',
        headers: {
          'Authorization': 'test-auth',
          'X-App-Token': 'app-token',
          'X-Socrata-Host': 'localhost:6668',
          'Content-Type': 'application/vnd.google-earth.kml+xml'
        }
      })), (resp, buffered) => {

        expect(resp.statusCode).to.equal(200);

        var {
          minx: minx,
          miny: miny,
          maxx: maxx,
          maxy: maxy
        } = buffered.layers[0].layer.bbox;

        expect(minx).to.exist;
        expect(miny).to.exist;
        expect(maxx).to.exist;
        expect(maxy).to.exist;


        onDone();
      });
  });
});