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

      logger.info(obj, 'Sending ISS a message');
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