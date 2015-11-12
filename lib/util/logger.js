import bunyan from 'bunyan';
import config from '../config';

let logger = false;

class Logger {

  constructor() {
    var conf = config();
    if(!conf.log) throw new Error("Attempted to create logger without a log configuration!");
    this._log = bunyan.createLogger(conf.log);
    this._proxy();
  }

  _proxy() {
    ['debug', 'info', 'warn', 'error', 'critical'].forEach((lvl) => {
      this[lvl] = (payload) => {
        this._log[lvl](payload);
      }.bind(this);
    }.bind(this));
  }

  _formatRequest(payload) {
    this._log.info(payload);
  }

  _bindRequest(req, res, next) {
    req.log = res.log = this._log;

    req.log.info(`Request to ${req.url} with ${req.headers['content-type']}`);
    res.on('finish', () => {
      req.log.info(`Request finished with ${res.statusCode}`)
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
if(!logger) logger = new Logger();

export default logger;