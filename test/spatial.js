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

describe('unit :: spatial service', function() {
  var app;
  var mockZk;
  var mockCore;
  var port = config().port;
  var url = `http://localhost:${port}`;

  beforeEach(function(onDone) {
    service({
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
          dataTypeName: "point"
        });

        expect(aString.body).to.eql({
          fieldName: "a_string",
          name: "a_string",
          dataTypeName: "text"
        });

        expect(aNum.body).to.eql({
          fieldName: "a_num",
          name: "a_num",
          dataTypeName: "number"
        });

        expect(aFloat.body).to.eql({
          fieldName: "a_float",
          name: "a_float",
          dataTypeName: "number"
        });

        expect(aBool.body).to.eql({
          fieldName: "a_bool",
          name: "a_bool",
          dataTypeName: "checkbox"
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
        }]);

        expect(JSON.parse(upsert.bufferedRows)).to.eql(
          [{
            "the_geom": {
              "coordinates": [102, 0.5],
              "type": "Point"
            },
            "a_string": "first value",
            "a_num": 2,
            "a_float": 2.2,
            "a_bool": false
          }, {
            "the_geom": {
              "coordinates": [103, 1.5],
              "type": "Point"
            },
            "a_string": "second value",
            "a_num": 2,
            "a_float": 2.2,
            "a_bool": true
          }]
        );
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