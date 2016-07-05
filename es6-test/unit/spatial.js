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
import AmqMock from '../services/mock-amq';
import ISS from '../../es6-lib/upstream/iss';
import MockZKClient from '../services/mock-zk';
import {
  EventEmitter
}
from 'events';
import config from '../../lib/config';
import SpatialService from '../../lib/services/spatial';
import qs from 'querystring';
import {
  messageDetails
}
from '../util';

const expect = chai.expect;

describe('spatial service', function() {
  const conf = config();
  const corePort = 7001; //coreport
  const url = `http://localhost:${conf.port}`;

  var mockCore;
  const mockAmq = new AmqMock();
  const iss = new ISS(mockAmq);
  iss.setMaxListeners(100);

  //start on ISS mocking, hook into events from ISS
  //for testing the actual imports

  var mockZk;
  var service;

  before(function(onDone) {
    mockZk = new MockZKClient(corePort);
    mockZk.on('connected', () => {
      service = new SpatialService(mockZk, mockAmq, iss);
      onDone();
    });
    mockZk.connect();
  });

  beforeEach(function() {
    mockCore = new CoreMock(corePort);

    mockAmq.removeAllListeners('/queue/eurybates.import-status-events');
    mockZk.disableErrors();
  });

  afterEach(function() {
    mockCore.close();
  });

  function sequencer(funcs, onDone) {
    return (...args) => {
      funcs.shift().call(this, ...args);
      if (funcs.length === 0) onDone();
    };
  }



  it('can put an Import geojson message and it will make a create dataset request to core', function(onDone) {
    const names = ['A layer named foo'];
    mockAmq.on('/queue/eurybates.import-status-events', sequencer([
      (startMessage) => {
        startMessage = JSON.parse(startMessage);

        expect(messageDetails(startMessage)).to.eql({
          actType: 'Import',
          user: 'kacw-u8uj',
          datasetId: 'ffff-ffff',
          domain: 'localhost',
          jobId: 'e7b813c8-d68e-4c8a-b1bc-61c709816fc3',
          jobName: 'simple_points.json',
          service: 'Imports2'
        });
      }, (finishMessage) => {
        finishMessage = JSON.parse(finishMessage);

        var createRequest = _.first(mockCore.history);
        expect(createRequest.body).to.eql({
          name: 'A layer named foo',
          displayType: 'geoRows',
          privateMetadata: {
            isNbe: true
          }
        });

        const [geomCol, strCol, numCol, floatCol, boolCol] = mockCore.history.slice(1, 6).map(r => r.body);

        expect(geomCol.dataTypeName).to.eql('point');
        expect(strCol.dataTypeName).to.eql('text');
        expect(numCol.dataTypeName).to.eql('number');
        expect(floatCol.dataTypeName).to.eql('number');
        expect(boolCol.dataTypeName).to.eql('checkbox');

      }
    ], onDone));
    mockAmq.importFixture('simple_points.json', names);
  });

  it('can put a Replace geojson message and it will make a replace dataset request to core', function(onDone) {
    const names = [{
      name: 'A new layer name',
      replacingUid: 'qs32-qpt7'
    }];

    mockAmq.on('/queue/eurybates.import-status-events', sequencer([
      (startMessage) => {
        startMessage = JSON.parse(startMessage);

        expect(startMessage.tag).to.eql('IMPORT_ACTIVITY_START');
        expect(messageDetails(startMessage)).to.eql({
          actType: 'Import',
          user: 'kacw-u8uj',
          datasetId: 'ffff-ffff',
          domain: 'localhost',
          jobId: 'e7b813c8-d68e-4c8a-b1bc-61c709816fc3',
          jobName: 'simple_points.json',
          service: 'Imports2'
        });
      }, (finishMessage) => {
        finishMessage = JSON.parse(finishMessage);

        var [replaceRequest, getColReq, delColReq0, delColReq1, geom, aString, aNum, aFloat, aBool] = mockCore.history;
        expect(replaceRequest.url).to.equal(
          '/views/qs32-qpt7/publication?method=copySchema'
        );
        expect(replaceRequest.method).to.equal('POST');

        expect(getColReq.url).to.equal(
          '/views/qs32-qpt8/columns'
        );
        expect(getColReq.method).to.equal('GET');

        expect(delColReq0.url).to.equal(
          '/views/qs32-qpt8/columns/3415'
        );
        expect(delColReq0.method).to.equal('DELETE');

        expect(delColReq1.url).to.equal(
          '/views/qs32-qpt8/columns/3416'
        );
        expect(delColReq1.method).to.equal('DELETE');

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
      }

    ], onDone));

    mockAmq.replaceFixture('simple_points.json', names);
  });

  it('can put geojson replace message with no metadata and it will make a replace dataset request to core', function(onDone) {
    mockAmq.on('/queue/eurybates.import-status-events', sequencer([
      (startMessage) => {
        startMessage = JSON.parse(startMessage);

        expect(startMessage.tag).to.eql('IMPORT_ACTIVITY_START');
        expect(messageDetails(startMessage)).to.eql({
          actType: 'Import',
          user: 'kacw-u8uj',
          datasetId: 'ffff-ffff',
          domain: 'localhost',
          jobId: 'e7b813c8-d68e-4c8a-b1bc-61c709816fc3',
          jobName: 'simple_points.json',
          service: 'Imports2'
        });
      }, (finishMessage) => {
        finishMessage = JSON.parse(finishMessage);

        var [createRequest, geom, aString, aNum, aFloat, aBool] = mockCore.history;
        expect(createRequest.url).to.equal(
          '/views?nbe=true'
        );
        expect(createRequest.method).to.equal('POST');

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
      }
    ], onDone));
    mockAmq.replaceFixture('simple_points.json', []);
  });

  it('can put kml new and replace ids message and it will make create and replace requests to core', function(onDone) {
    const script = [{
      name: 'foo',
      replacingUid: 'qs32-qpt7'
    }, {
      name: 'bar'
    }];

    mockAmq.on('/queue/eurybates.import-status-events', sequencer([
      (startMessage) => {
        startMessage = JSON.parse(startMessage);

        expect(startMessage.tag).to.eql('IMPORT_ACTIVITY_START');
        expect(messageDetails(startMessage)).to.eql({
          actType: 'Import',
          user: 'kacw-u8uj',
          datasetId: 'ffff-ffff',
          domain: 'localhost',
          jobId: 'e7b813c8-d68e-4c8a-b1bc-61c709816fc3',
          jobName: 'points_and_lines_multigeom.kml',
          service: 'Imports2'
        });
      }, (_) => {

        var [replaceRequest, createRequest] = mockCore.history;

        expect(replaceRequest.url).to.equal(
          '/views/qs32-qpt7/publication?method=copySchema'
        );
        expect(replaceRequest.method).to.equal('POST');
        expect(createRequest.url).to.equal('/views?nbe=true');
      }
    ], onDone));

    mockAmq.replaceFixture('points_and_lines_multigeom.kml', script);
  });

  it('can post kml and it will do an upsert to core', function(onDone) {
    mockAmq.on('/queue/eurybates.import-status-events', sequencer([
      (startMessage) => {}, (finishMessage) => {
        finishMessage = JSON.parse(finishMessage);

        expect(messageDetails(finishMessage)).to.eql({
          activityId: 'e7b813c8-d68e-4c8a-b1bc-61c709816fc3',
          status: 'Success',
          info: {
            warnings: [],
            totalRows: 0
          },
          service: 'Imports2'
        });

        const trace = mockCore.history.map(r => [r.method, r.url]);

        expect(trace).to.eql([
          ['POST', '/views?nbe=true'],
          ['POST', '/views/qs32-qpt7/columns'],
          ['POST', '/views/qs32-qpt7/columns'],
          ['POST', '/views/qs32-qpt7/columns'],
          ['POST', '/views/qs32-qpt7/columns'],
          ['POST', '/views/qs32-qpt7/columns'],
          ['POST', '/id/qs32-qpt7.json'],
          ['POST', '/views/qs32-qpt7/publication'],
          ['PUT', '/views/qs32-qpt7']
        ]);
      }
    ], onDone));

    mockAmq.importFixture('simple_points.kml', ['foo'], 'qs32-qpt7');
  });

  it('can post kmz points and it will do an upsert to core', function(onDone) {
    mockAmq.on('/queue/eurybates.import-status-events', sequencer([
      (startMessage) => {}, (finishMessage) => {
        finishMessage = JSON.parse(finishMessage);

        expect(messageDetails(finishMessage)).to.eql({
          activityId: 'e7b813c8-d68e-4c8a-b1bc-61c709816fc3',
          status: 'Success',
          info: {
            warnings: [],
            totalRows: 0
          },
          service: 'Imports2'
        });

        const trace = mockCore.history.map(r => [r.method, r.url]);

        expect(trace).to.eql([
          ['POST', '/views?nbe=true'],
          ['POST', '/views/qs32-qpt7/columns'],
          ['POST', '/views/qs32-qpt7/columns'],
          ['POST', '/views/qs32-qpt7/columns'],
          ['POST', '/views/qs32-qpt7/columns'],
          ['POST', '/views/qs32-qpt7/columns'],
          ['POST', '/id/qs32-qpt7.json'],
          ['POST', '/views/qs32-qpt7/publication'],
          ['PUT', '/views/qs32-qpt7']
        ]);
      }
    ], onDone));

    mockAmq.importFixture('simple_points.kmz', ['bar'], 'qs32-qpt7');
  });

  it('can post geojson and it will make a create columns request to core', function(onDone) {
    const names = ['A layer named foo'];
    mockAmq.on('/queue/eurybates.import-status-events', sequencer([
      (startMessage) => {
        expect(messageDetails(JSON.parse(startMessage))).to.eql({
          actType: 'Import',
          user: 'kacw-u8uj',
          datasetId: 'ffff-ffff',
          domain: 'localhost',
          jobId: 'e7b813c8-d68e-4c8a-b1bc-61c709816fc3',
          jobName: 'simple_points.json',
          service: 'Imports2'
        });
      }, (finishMessage) => {
        var createRequest = _.first(mockCore.history);
        expect(createRequest.body).to.eql({
          name: 'A layer named foo',
          displayType: 'geoRows',
          privateMetadata: {
            isNbe: true
          }
        });

        const [geom, aString, aNum, aFloat, aBool] = mockCore.history.slice(1, 6);

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

      }
    ], onDone));
    mockAmq.importFixture('simple_points.json', names);
  });

  it('can post single layer and it will upsert to core', function(onDone) {
    const names = ['A layer named foo'];

    mockAmq.on('/queue/eurybates.import-status-events', sequencer([
      (startMessage) => {}, (finishMessage) => {
        var [upsert] = mockCore.history.slice(6);

        //check the request body that was actuall sent to core
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
      }
    ], onDone));
    mockAmq.importFixture('simple_points.json', names);
  });

  it('can post multi layer kml and it will upsert to core', function(onDone) {
    const names = ['some points', 'some lines'];

    mockAmq.on('/queue/eurybates.import-status-events', sequencer([
      (startMessage) => {}, (finishMessage) => {
        finishMessage = JSON.parse(finishMessage);

        expect(finishMessage.details.status).to.eql('Success');

        //get the 2 upserts, which will be requests 6 and 7
        const [upsertPoints, upsertLines] = mockCore.history.slice(6, 8).map(r => {
          return JSON.parse(r.bufferedRows);
        });

        expect(upsertPoints[0].the_geom.type).to.eql('MultiPoint');
        expect(upsertLines[0].the_geom.type).to.eql('MultiLineString');
      }
    ], onDone));
    mockAmq.importFixture('points_and_lines_multigeom.kml', names);
  });


  it('will emit a failure to ISS when zk is dead', function(onDone) {
    mockZk.enableErrors();

    mockAmq.on('/queue/eurybates.import-status-events', sequencer([
      (startMessage) => {}, (finishMessage) => {
        finishMessage = JSON.parse(finishMessage);

        //TODO: hopefully we can plumb better errors into this ISS event?
        expect(finishMessage.details.status).to.eql('Failure');
      }
    ], onDone));
    mockAmq.importFixture('simple_points.json', []);
  });


  it('will emit a failure to ISS when core is dead', function(onDone) {
    mockCore.close();

    mockAmq.on('/queue/eurybates.import-status-events', sequencer([
      (startMessage) => {}, (finishMessage) => {
        finishMessage = JSON.parse(finishMessage);

        //TODO: hopefully we can plumb better errors into this ISS event?
        expect(finishMessage.details.status).to.eql('Failure');
      }
    ], onDone));
    mockAmq.importFixture('simple_points.json', []);
  });


  it('will emit an error for a corrupt shapefile', function(onDone) {
    mockAmq.on('/queue/eurybates.import-status-events', sequencer([
      (startMessage) => {}, (finishMessage) => {
        finishMessage = JSON.parse(finishMessage);

        //TODO: hopefully we can plumb better errors into this ISS event?
        expect(finishMessage.details.status).to.eql('Failure');
      }
    ], onDone));
    mockAmq.importFixture('corrupt_shapefile.zip', []);
  });

  it('will delete any created layers when an error is encountered in column creation', function(onDone) {
    mockCore.failColumns = 503;
    mockAmq.on('/queue/eurybates.import-status-events', sequencer([
      (_) => {}, (_finishMessage) => {
        var del = _.last(mockCore.history);
        expect(del.method).to.equal('DELETE');
        expect(del.url).to.equal('/views/qs32-qpt7');
      }
    ], onDone));
    mockAmq.importFixture('simple_points.json', []);
  });


  it('will not delete any replacement layers when an error is encountered getting column info', function(onDone) {
    mockCore.failGetColumns = 503;
    mockAmq.on('/queue/eurybates.import-status-events', sequencer([
      (_) => {}, (_finishMessage) => {
        var colInfo = _.last(mockCore.history);

        expect(colInfo.method).to.equal('GET');
        expect(colInfo.url).to.equal('/views/qs32-qpt8/columns');
      }
    ], onDone));
    mockAmq.replaceFixture(
      'simple_points.json', [{
        name: 'foo',
        replacingUid: 'qs32-qpt7'
      }]
    );
  });


  it('will not delete any created layers when an error is encountered in delete columns', function(onDone) {
    mockCore.failDeleteColumns = 503;

    mockAmq.on('/queue/eurybates.import-status-events', sequencer([
      (_) => {}, (_finishMessage) => {
        var deleteColumn = _.last(mockCore.history);
        expect(deleteColumn.method).to.equal('DELETE');
        expect(deleteColumn.url).to.equal('/views/qs32-qpt8/columns/3416');
      }
    ], onDone));

    mockAmq.replaceFixture(
      'simple_points.json', [{
        name: 'foo',
        replacingUid: 'qs32-qpt7'
      }]
    );

  });

  it('will delete any created layers when an error is encountered mid-upsert', function(onDone) {
    mockCore.failUpsert = 503;

    mockAmq.on('/queue/eurybates.import-status-events', sequencer([
      (_) => {}, (_finishMessage) => {
        var del = _.last(mockCore.history);
        expect(del.method).to.equal('DELETE');
        expect(del.url).to.equal('/views/qs32-qpt7');
      }
    ], onDone));

    mockAmq.importFixture('simple_points.json', []);
  });

  it('will give a 400 on complex shapes', function(onDone) {
    var oldMax = conf.maxVerticesPerRow;
    conf.maxVerticesPerRow = 1;
    mockAmq.on('/queue/eurybates.import-status-events', sequencer([
      (_) => {}, (finishMessage) => {
        finishMessage = JSON.parse(finishMessage);

        expect(finishMessage.details.status).to.eql('Failure');
        conf.maxVerticesPerRow = oldMax;
      }
    ], onDone));
    mockAmq.importFixture('simple_multipolygons.json', []);
  });
});