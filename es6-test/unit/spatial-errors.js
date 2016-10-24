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
import config from '../../es6-lib/config';
import SpatialService from '../../es6-lib/services/spatial';
import qs from 'querystring';
import {
  messageDetails
}
from '../util';

const expect = chai.expect;

describe('spatial service failures', function() {
  const conf = config();
  const corePort = 7001; //coreport
  const url = `http://localhost:${conf.port}`;

  var mockCore;
  const mockAmq = new AmqMock();

  //start on ISS mocking, hook into events from ISS
  //for testing the actual imports

  var mockZk;
  var service;

  before(function(onDone) {
    mockZk = new MockZKClient(corePort);
    mockZk.on('connected', () => {
      service = new SpatialService(mockZk, mockAmq);
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

  function reason(m) {
    return JSON.parse(m).details.eventType;
  }

  it('will emit a CreateDatasetError when core request to create dataset fails', function(onDone) {
    mockCore.failCreate = 503;
    mockAmq.on('/queue/eurybates.import-status-events', sequencer([
      (_) => {}, (m) => {
        expect(reason(m)).to.equal('create-dataset-error');
      }
    ], onDone));
    mockAmq.importFixture('simple_points.json', []);
  });

  it('will emit a CreateColumnError when core request to create a column fails', function(onDone) {
    mockCore.failColumns = 503;
    mockAmq.on('/queue/eurybates.import-status-events', sequencer([
      (_) => {}, (m) => {
        expect(reason(m)).to.equal('create-column-error');
      }
    ], onDone));
    mockAmq.importFixture('simple_points.json', []);
  });

  it('will emit a GetColumnError when core request to get columns fails', function(onDone) {
    mockCore.failGetColumns = 503;
    mockAmq.on('/queue/eurybates.import-status-events', sequencer([
      (_) => {}, (m) => {
        expect(reason(m)).to.equal('get-column-error');
      }
    ], onDone));
    mockAmq.replaceFixture('simple_points.json', [{
      name: 'A new layer name',
      replacingUid: 'qs32-qpt7'
    }]);
  });

  it('will emit a PublicationError when core request to publish fails', function(onDone) {
    mockCore.failPublication = 503;
    mockAmq.on('/queue/eurybates.import-status-events', sequencer([
      (_) => {}, (m) => {
        expect(reason(m)).to.equal('publication-error');
      }
    ], onDone));
    mockAmq.replaceFixture('simple_points.json', [{
      name: 'A new layer name',
      replacingUid: 'qs32-qpt7'
    }]);
  });

  it('will emit a CreateWorkingCopyError when core request to make a working copy fails', function(onDone) {
    mockCore.failWorkingCopy = 503;
    mockAmq.on('/queue/eurybates.import-status-events', sequencer([
      (_) => {}, (m) => {
        expect(reason(m)).to.equal('create-working-copy-error');
      }
    ], onDone));
    mockAmq.replaceFixture('simple_points.json', [{
      name: 'A new layer name',
      replacingUid: 'qs32-qpt7'
    }]);
  });

  it('will emit a DeleteColumnError when core request to delete a column fails', function(onDone) {
    mockCore.failDeleteColumns = 503;
    mockAmq.on('/queue/eurybates.import-status-events', sequencer([
      (_) => {}, (m) => {
        expect(reason(m)).to.equal('delete-column-error');
      }
    ], onDone));
    mockAmq.replaceFixture('simple_points.json', [{
      name: 'A new layer name',
      replacingUid: 'qs32-qpt7'
    }]);
  });

  it('will emit a UpdateMetadataError when core request to update metadata fails', function(onDone) {
    mockCore.failDeleteColumns = 503;
    mockAmq.on('/queue/eurybates.import-status-events', sequencer([
      (_) => {}, (m) => {
        expect(reason(m)).to.equal('delete-column-error');
      }
    ], onDone));
    mockAmq.replaceFixture('simple_points.json', [{
      name: 'A new layer name',
      replacingUid: 'qs32-qpt7'
    }]);
  });

  it('will emit a UpsertError when core request to upsert fails', function(onDone) {
    mockCore.failUpsert = 503;
    mockAmq.on('/queue/eurybates.import-status-events', sequencer([
      (_) => {}, (m) => {
        expect(reason(m)).to.equal('upsert-error');
      }
    ], onDone));
    mockAmq.replaceFixture('simple_points.json', [{
      name: 'A new layer name',
      replacingUid: 'qs32-qpt7'
    }]);
  });
});