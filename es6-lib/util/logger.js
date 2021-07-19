import _ from 'underscore';
import bunyan from 'bunyan';
import config from '../config';
import uuid from 'uuid';
let logger = false;

class LogWrapper {
  constructor(log, identifiers) {
    this._log = log;
    if(!this._log) throw new Error('Where is log?');
    this._proxy(identifiers);
  }

  _proxy(identifiers) {
    ['debug', 'info', 'warn', 'error', 'fatal'].forEach((level) => {
      this[level] = (metadata, message) => {
        if(_.isObject(metadata)) {
          metadata = _.extend({}, metadata, identifiers);
          this._log[level](metadata, message);
        } else if(_.isString(metadata)) {
          this._log[level](identifiers, metadata);
        }
      };
    });
  }

}


class RequestLogger extends LogWrapper {
  constructor(req, log) {
    super(log, {
      request_id: req.headers['x-socrata-requestid'] || uuid.v4().slice(0, 8)
    });
  }
}

class ActivityLogger extends LogWrapper {
  constructor(activity, log) {
    super(log, {
      activity_id: activity.getActivityId()
    });
  }
}


class Logger extends LogWrapper {

  constructor() {
    var conf = config();
    if (!conf.log) throw new Error("Attempted to create logger without a log configuration!");
    super(bunyan.createLogger(conf.log), {});
  }

  decorateRequest() {
    return (req, res, next) => {
      req.log = res.log = new RequestLogger(req, this._log);
      req.log.info(`Request to ${req.url} with ${req.headers['content-type']}`);
      res.on('finish', () => {
        req.log.info(`Request finished with ${res.statusCode}`);
      });

      var s = res.send.bind(res);
      res.send = (payload) => {
        if (res.statusCode >= 400) {
          res.log.warn(payload);
        }
        return s(payload);
      };

      next();
    };
  }

  decorateActivity(activity) {
    activity.log = new ActivityLogger(activity, this._log);
    return activity;
  }
}

//;_; ;_; ;_; ;_; this is weird
if (!logger) logger = new Logger();

export default logger;