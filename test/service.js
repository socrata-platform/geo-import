import chai from 'chai';
import should from 'should';
import * as es from 'event-stream';
import {
  fixture
}
from './fixture';
import request from 'request';
import CoreMock from './services/mock-core';
import MockZKClient from './services/mock-zk';
import {
  EventEmitter
}
from 'events';

var expect = chai.expect;

var config = require('../lib/config');

var service = require('../lib/service');

describe('service level', function() {
  var app;
  var mockZk;
  var mockCore;
  var port = config().port;
  var url = `http://localhost:${port}`;
  before(function(onDone) {

    mockZk = new MockZKClient();
    mockZk.connect();
    mockZk.on('connected', function() {
      mockCore = new CoreMock(mockZk.corePort);

      service({
        port: port,
        zkClient: MockZKClient
      }, (a) => {
        app = a;
        onDone();
      });
    });
  });

  after(function() {
    mockCore.close();
    app.close();
  });

  it('can get the version of the service', function(onDone) {
    request
      .get(`${url}/version`, function(err, res) {
        expect(JSON.parse(res.body)).to.eql({
          version: 0
        });
        onDone();
      });
  });

  it('passes headers through to core', function(onDone) {
    fixture('simple_points.json')
      .pipe(request.post({
        url : url + '/spatial',
        headers : {
          'Authorization': 'test-auth',
          'X-App-Token': 'app-token',
          'Content-Type': 'application/json'
        }
      }))
      .on('response', function(err, response) {
        expect(err.statusCode).to.equal(400);
        onDone();
      });
  });


  it('can post geojson and it will upsert to core', function(onDone) {
    fixture('simple_points.json')
      .pipe(request.post({
        url : url + '/spatial',
        headers : {
          'Authorization': 'test-auth',
          'X-App-Token': 'app-token',
          'X-Socrata-Host': 'localhost:6668',
          'Content-Type': 'application/json'
        }
      }))
      .on('response', function(err, response) {
        console.log('resp', err.statusCode);
        onDone();
      });
  });
});