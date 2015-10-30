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

var expect = chai.expect;

var config = require('../lib/config');

var service = require('../lib/service');

describe('service level', function() {
  var app;
  var mockZk;
  var mockCore;
  var port = config().port;
  var url = `http://localhost:${port}`;

  beforeEach(function(onDone) {
    service({
      port: port,
      zkClient: MockZKClient
    }, (a, zk) => {
      mockZk = zk;
      app = a;
      mockCore = new CoreMock(mockZk.corePort);
      onDone();
    });
  });

  afterEach(function() {
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

  it('can post geojson and it will make a create dataset request to core', function(onDone) {
    fixture('simple_points.json')
      .pipe(request.post({
        url: url + '/spatial',
        headers: {
          'Authorization': 'test-auth',
          'X-App-Token': 'app-token',
          'X-Socrata-Host': 'localhost:6668',
          'Content-Type': 'application/json'
        }
      }))
      .on('response', function(response) {
        var createRequest = _.first(mockCore.history);
        expect(createRequest.body).to.eql({
          name: 'layer_0'
        });
        onDone();
      });
  });

  it('can post geojson and it will make a create columns request to core', function(onDone) {
    bufferJs(fixture('simple_points.json')
      .pipe(request.post({
        url: url + '/spatial',
        headers: {
          'Authorization': 'test-auth',
          'X-App-Token': 'app-token',
          'X-Socrata-Host': 'localhost:6668',
          'Content-Type': 'application/json'
        }
      })), (resp, buffered) => {

        var [geom, aString, aNum, aFloat, aBool] = mockCore.history.slice(1, 6);

        expect(geom.body).to.eql({
          fieldName: "the_geom",
          name: "the_geom",
          dataTypeName: "SoQLPoint"
        });

        expect(aString.body).to.eql({
          fieldName: "a_string",
          name: "a_string",
          dataTypeName: "SoQLText"
        });

        expect(aNum.body).to.eql({
          fieldName: "a_num",
          name: "a_num",
          dataTypeName: "SoQLNumber"
        });

        expect(aFloat.body).to.eql({
          fieldName: "a_float",
          name: "a_float",
          dataTypeName: "SoQLNumber"
        });

        expect(aBool.body).to.eql({
          fieldName: "a_bool",
          name: "a_bool",
          dataTypeName: "SoQLBoolean"
        });
        onDone();
      });
  });

  it('can post geojson and it will upsert to core', function(onDone) {
    bufferJs(fixture('simple_points.json')
      .pipe(request.post({
        url: url + '/spatial',
        headers: {
          'Authorization': 'test-auth',
          'X-App-Token': 'app-token',
          'X-Socrata-Host': 'localhost:6668',
          'Content-Type': 'application/json'
        }
      })), (resp, buffered) => {
        var [upsert] = mockCore.history.slice(6);
        expect(resp.statusCode).to.equal(202);
        expect(buffered).to.eql([{
          'uid': 'qs32-qpt7',
          'created': 2
        }])

        onDone();
      });
  });

  it('will return a 503 when zk is dead', function(onDone) {
    mockZk.enableErrors();

    bufferJs(fixture('simple_points.json')
      .pipe(request.post({
        url: url + '/spatial',
        headers: {
          'Authorization': 'test-auth',
          'X-App-Token': 'app-token',
          'X-Socrata-Host': 'localhost:6668',
          'Content-Type': 'application/json'
        }
      })), (resp, buffered) => {
        expect(resp.statusCode).to.equal(503);
        onDone();
      });
  });

  it('will return a 503 when core is dead', function(onDone) {
    mockCore.close();

    bufferJs(fixture('simple_points.json')
      .pipe(request.post({
        url: url + '/spatial',
        headers: {
          'Authorization': 'test-auth',
          'X-App-Token': 'app-token',
          'X-Socrata-Host': 'localhost:6668',
          'Content-Type': 'application/json'
        }
      })), (resp, buffered) => {
        expect(resp.statusCode).to.equal(503);
        onDone();
      });
  });


});