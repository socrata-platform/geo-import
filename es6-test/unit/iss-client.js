import _ from 'underscore';
import chai from 'chai';
import should from 'should';
import AmqMock from '../services/mock-amq';
import ISS from '../../es6-lib/upstream/iss';
import {
  messageDetails
}
from '../util';
const expect = chai.expect;

describe('iss client', function() {
  var amq;
  var issClient;

  beforeEach(function() {
    amq = new AmqMock();
    issClient = new ISS(amq);
  });

  it('can emit an import event', function(onDone) {
    amq.on('/queue/eurybates.import-status-events', (message) => {
      expect(messageDetails(JSON.parse(message))).to.eql({
        actType: 'Import',
        user: 'user',
        datasetId: 'four-four',
        domain: 'domain.foo.com',
        jobId: 'activity-id',
        jobName: 'foo.csv',
        service: 'Imports2'
      });
      onDone();
    });

    issClient.activity({
      id: 'activity-id'
    }).onCreate(
      'user',
      'four-four',
      'domain.foo.com',
      'foo.csv'
    );
  });

  it('can emit a replace event', function(onDone) {
    amq.on('/queue/eurybates.import-status-events', (message) => {
      expect(messageDetails(JSON.parse(message))).to.eql({
        actType: 'Replace',
        user: 'user',
        datasetId: 'four-four',
        domain: 'domain.foo.com',
        jobId: 'activity-id',
        jobName: 'foo.csv',
        service: 'Imports2'
      });
      onDone();
    });

    issClient.activity({
      id: 'activity-id'
    }).onReplace(
      'user',
      'four-four',
      'domain.foo.com',
      'foo.csv'
    );
  });

});