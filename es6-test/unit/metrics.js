import _ from 'underscore';
import chai from 'chai';
import should from 'should';
import * as es from 'event-stream';
import fs from 'fs';
import {
  fixture, bufferJs
}
from '../fixture';
import CoreMock from '../services/mock-core';

import request from 'request';
import MockZKClient from '../services/mock-zk';
import {
  EventEmitter
}
from 'events';
import config from '../../lib/config';
import service from '../../lib/service';

var expect = chai.expect;

describe('metrics service', () => {
  var app;
  var port = config().port;
  var url = `http://localhost:${port}`;
  var corePort = 7001; //coreport
  var mockCore;

  beforeEach((onDone) => {
    var zk = new MockZKClient(corePort);
    service(zk, {}, (a, zk) => {
      app = a;
      mockCore = new CoreMock(corePort);
      onDone();
    });
  });

  afterEach(() => {
    app.close();
    mockCore.close();
  });

  function makeARequest(onDone) {
    fixture('simple_points.json')
      .pipe(request.post({
        url: url + `/summary?what=asf`,
        headers: {
          'Authorization': 'test-auth',
          'X-App-Token': 'app-token',
          'X-Socrata-Host': 'localhost:6668',
          'Content-Type': 'application/json'
        }
      }))
      .on('response', onDone);
  }


  it('can increment a request counter', (onDone) => {
    makeARequest(() => {
      expect(app.metrics.state.http).to.eql({
        status: {
          '200': {
            count: 1
          }
        }
      });
      onDone();
    });
  });


  it('can get the process memory from the endpoint ', (onDone) => {
    makeARequest(() => {
      expect(Object.keys(app.metrics.state.memory).sort()).to.eql([
        'rss',
        'heapTotal',
        'heapUsed'
      ].sort());
      onDone();
    });
  });

});