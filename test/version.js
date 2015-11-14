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

describe('unit :: version service', function() {
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

  it('can get the version of the service', function(onDone) {
    request
      .get(`${url}/version`, function(err, res) {
        expect(JSON.parse(res.body)).to.eql({
          version: 0
        });
        expect(res.statusCode).to.equal(200);
        expect(res.headers['content-type']).to.contain('application/json');
        onDone();
      });
  });


});