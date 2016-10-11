import config from '../config';
import _ from 'underscore';
import EventEmitter from 'events';
import uuid from 'uuid';
import logger from '../util/logger';
import async from 'async';

const conf = config();

class ISS extends EventEmitter {
  constructor(amq, message) {
    super();

    this._message = message;
    this._rollbacks = [];

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

    logger.decorateActivity(this);
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

  getParentUid() {
    return this._message.view;
  }

  getActivityId() {
    return this._message.id;
  }

  getBlobId() {
    return this._message.blobId;
  }

  getBlobName() {
    return this._message.filename;
  }

  appendRollback(tag, func) {
    this._rollbacks.push((onRolledback) => {
      this.log.warn(`Starting rollback of ${tag}`);
      func(onRolledback);
    });
  }

  rollback(onRolledback) {
    async.series(this._rollbacks, (err, results) => {
      if(err) {
        this.log.error(`Failed to roll back from failed job! ${err}`);
        return onRolledback(err);
      }
      this.log.info('Successfully rolled back failed job.');
      return onRolledback(false, results);
    });
  }

  onSuccess(warnings, totalRows) {
    this._onEnd({
      activityId: this._message.id,
      status: 'Success',
      info: {
        warnings: warnings,
        totalRows: totalRows
      },
    });
  }

  onError(reason) {
    this._onEnd(_.extend({
      activityId: this._message.id,
      status: 'Failure',
      eventType: 'generic',
      info: {}
    }, reason.toJSON()));
  }

  onProgress(rowsComplete, totalRows) {
    this._onProgress({
      activityId: this._message.id,
      status: 'InProgress',
      eventType: 'row-progress',
      info: {
        rowsComplete, totalRows
      }
    });
  }

  onStart() {
    this._onProgress({
      activityId: this._message.id,
      status: 'InProgress',
      eventType: 'row-progress',
      info: {
        rowsComplete: 0, totalRows: 0
      }
    });
  }

}

export
default ISS;