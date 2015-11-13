import _ from 'underscore';
import bunyan from 'bunyan';
import config from '../config';
import uuid from 'uuid';
let logger = false;

class LogWrapper {
  _proxy() {
    ['debug', 'info', 'warn', 'error', 'critical'].forEach((lvl) => {
      this[lvl] = (payload) => {
        this._log[lvl](payload);
      }.bind(this);
    }.bind(this));
  }
}

class RequestLogger extends LogWrapper {
  constructor(req, res, log) {
    super();
    this._log = log;
    this._req = req;
    this._res = res;
    this._proxy();
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

  _formatRequest(payload) {
    this._log.info(payload);
  }

  _getOrGenReqId(req) {
    return req.headers['x-socrata-requestid'] || uuid.v4().slice(0, 8);
  }

  _bindRequest(req, res, next) {
    req._requestId = this._getOrGenReqId(req);
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