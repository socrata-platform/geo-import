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
    issClient = new ISS(amq, {id: 'activity-id'});
  });

  it('can emit a success event', function(onDone) {
    amq.on('/queue/eurybates.import-status-events', (message) => {
      expect(messageDetails(JSON.parse(message))).to.eql({
        activityId: 'activity-id',
        entityType: 'Dataset',
        info: {
          totalRows: 42,
          warnings: ['i am a warning']
        },
        service: 'Imports2',
        status: 'Success'
      });
      onDone();
    });

    issClient.onSuccess(['i am a warning'], 42);
  });

  it('can emit a failure event', function(onDone) {
    amq.on('/queue/eurybates.import-status-events', (message) => {
      expect(messageDetails(JSON.parse(message))).to.eql({
        activityId: 'activity-id',
        entityType: 'Dataset',
        service: 'Imports2',
        eventType: 'generic',
        info: {
          english: 'something broke',
        },
        status: 'Failure'
      });
      onDone();
    });

    issClient.onError({
      toJSON: () => {
        return {
          info: {
            english: 'something broke'
          }
        }
      }
    });
  });

});
