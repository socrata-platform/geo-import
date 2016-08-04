import config from '../config';
import _ from 'underscore';
import EventEmitter from 'events';
import uuid from 'uuid';
import logger from '../util/logger';
const conf = config();


const senders = {
  getParentUid: function(message) {
    return message.view;
  },

  //   {
  //   "tag" : "IMPORT_ACTIVITY_COMPLETE",
  //   "details" :
  //     {
  //       "status" : "Success",
  //       "info" : { "warnings" : [], "totalRows" : 139999 },
  //       "activityId" : "ce95cd38-5a44-467b-bade-b951ad5361a1",
  //       "eventTime" : "2016-06-27T21:36:49.312Z",
  //       "service" : "Imports2",
  //       "eventId" : "7458ec6f-e2db-4e71-ac22-fb9027a5e6e0"
  //     },
  //   "source_id" : "0204eba3-fe45-4eeb-ad59-f62d0581bbf2",
  //   "uuid" : "e952f14c-9259-407d-bed2-c80401b52757"
  // }
  onSuccess: function(message, warnings, totalRows) {
    this._onEnd({
      activityId: message.id,
      status: 'Success',
      info: {
        warnings: warnings,
        totalRows: totalRows
      },
    });
  },

  //   {
  //   "tag" : "IMPORT_ACTIVITY_COMPLETE",
  //   "details" :
  //     {
  //       "status" : "Failure",
  //       "info" : { "message" : "Internal error", "type" : "generic" },
  //       "activityId" : "79381f51-4103-452b-aa1a-77e0bee63c06",
  //       "eventType" : "generic",
  //       "eventTime" : "2016-06-24T16:41:18.484Z",
  //       "service" : "Imports2",
  //       "eventId" : "a0f58748-0de6-4427-95da-fa4985556298"
  //     },
  //   "source_id" : "0204eba3-fe45-4eeb-ad59-f62d0581bbf2",
  //   "uuid" : "7477fd2d-428a-45f0-94bb-df470497672d"
  // }
  onError: function(message, reason) {
    this._onEnd({
      activityId: message.id,
      status: 'Failure',
      eventType: 'generic',
      info: {
        'message': reason,
        'type': 'generic'
      }
    });
  },


  // {
  //   "tag" : "IMPORT_ACTIVITY_EVENT",
  //   "details" :
  //     {
  //       "status" : "InProgress",
  //       "info" : { "rowsComplete" : 14500, "totalRows" : 0 },
  //       "activityId" : "d2263805-8098-404a-8606-b4c2b1a8fd8d",
  //       "eventType" : "row-progress",
  //       "eventTime" : "2016-06-27T21:49:22.174Z",
  //       "service" : "Imports2",
  //       "eventId" : "d7309cea-88f0-4245-bb4f-7474ba915055"
  //     },
  //   "source_id" : "0204eba3-fe45-4eeb-ad59-f62d0581bbf2",
  //   "uuid" : "de2d0075-18c4-4f45-95c4-02163f43ba01"
  // }
  onProgress: function(message, rowsComplete, totalRows) {
    this._onProgress({
      activityId: message.id,
      status: 'InProgress',
      eventType: 'row-progress',
      info: {
        rowsComplete, totalRows
      }
    });
  },

  onStart: function(message) {
    this._onProgress({
      activityId: message.id,
      status: 'InProgress',
      eventType: 'row-progress',
      info: {
        rowsComplete: 0, totalRows: 0
      }
    });
  }
};

class ISS extends EventEmitter {
  constructor(amq) {
    super();
    this.send = (tag, details) => {
      details.service = 'Imports2';
      details.eventTime = (new Date()).toISOString();
      details.eventId = uuid.v4();

      const obj = {
        tag,
        details,
        source_id: uuid.v4(),
        uuid: uuid.v4()
      };
      const message = JSON.stringify(obj);

      logger.info(_.extend({msg: `Sending ISS`}, obj));
      amq.send(message);
    };
  }

  _onStart(details) {
    this.send('IMPORT_ACTIVITY_START', details);
  }

  _onEnd(details) {
    this.send('IMPORT_ACTIVITY_COMPLETE', details);
    this.emit('finish');
  }

  _onProgress(details) {
    this.send('IMPORT_ACTIVITY_EVENT', details);
  }


  activity(message) {
    return _.extend(this, _.mapObject(senders, (func) => {
      return _.partial(func, message).bind(this);
    }));
  }
}

export
default ISS;