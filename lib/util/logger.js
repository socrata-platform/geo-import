import _ from 'underscore';
import bunyan from 'bunyan';
import config from '../config';
import uuid from 'uuid';
let logger = false;

class LogWrapper {
  _proxy() {
    ['debug', 'info', 'warn', 'error', 'critical'].forEach((lvl) => {
      this[lvl] = (payload) => {
        this._log[lvl](this._meta(), payload);
      };
    });
  }

  _meta() {
    return {};
  }
}


class RequestLogger extends LogWrapper {
  constructor(req, res, log) {
    super();
    this._log = log;
    this._req = req;
    this._res = res;
    this._id = this._getOrGenReqId(req);
    this._proxy();
  }

  _getOrGenReqId(req) {
    return req.headers['x-socrata-requestid'] || uuid.v4().slice(0, 8);
  }

  _meta() {
    return {
      'request_id': this._id
    };
  }
}

class Logger extends LogWrapper {

  constructor() {
    super();
    var conf = config();
    if (!conf.log) throw new Error("Attempted to create logger without a log configuration!");
    this._log = bunyan.createLogger(conf.log);
    this._proxy();
  }

  _bindRequest(req, res, next) {
    req.log = res.log = new RequestLogger(req, res, this._log);
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
    }.bind(res);

    next();
  }

  request() {
    return this._bindRequest.bind(this);
  }
}

//;_; ;_; ;_; ;_; this is weird
if (!logger) logger = new Logger();

export default logger;