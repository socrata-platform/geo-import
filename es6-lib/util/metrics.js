import logger from './logger';
import heapdump from 'heapdump';
import fs from 'fs';
import path from 'path';
import gcstats from 'gc-stats';
import _ from 'underscore';
import config from '../config';
var conf = config();

class Metrics {
  constructor() {
    this._resetState();
    this._gc = gcstats();
    this._gc.on('stats', _.throttle(this._onGcStat, 1000).bind(this));
  }

  _resetState() {
    this._state = {
      http: {
        status: {}
      },
      gc: {},
      memory: {}
    };
  }

  metrics(req, res) {
    res.status(200).send(JSON.stringify(this.state));
  }

  get state() {
    this._sampleMemory();
    return this._state;
  }

  _onGcStat(stats) {
    this._state.gc.pause = stats.pause;
  }

  _sampleMemory() {
    this._state.memory = _.pick(process.memoryUsage(), 'rss', 'heapUsed', 'heapTotal');
  }

  countRequest(method, path, status, latency) {
    status = parseInt(status);
    var current = this._state.http.status[status] || {count: 0};
    this._state.http.status[status] = {count: current.count + 1};
  }

  _bindRequest(req, res, next) {
    var start = Date.now();
    res.on('finish', () => {
      var latency = Date.now() - start;
      this.countRequest(req.method, req.path, res.statusCode, latency);
    });
    next();
  }

  request() {
    return this._bindRequest.bind(this);
  }

  heapdump(req, res) {
    req.log.info('Making a heapdump');
    heapdump.writeSnapshot((err, filename) => {
      if (err) return res.status(500).send(err.toString());
      var heapDumpLocation = path.join(conf.heapDumpOut, filename);
      req.log.info(`Wrote heapdump to ${filename}, reading from ${heapDumpLocation}`);
      fs.createReadStream(heapDumpLocation)
        .pipe(res
          .status(200)
          .set('content-type', 'application/octet-stream')
          .set('content-disposition', `inline; filename="${filename}"`))
        .on('end', () => fs.unlink(filename));
    });
  }
}

export default Metrics;