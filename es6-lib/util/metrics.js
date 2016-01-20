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
    setInterval(this._sampleMemory.bind(this), 1000);
    this._gc = gcstats();
    this._gc.on('stats', _.throttle(this._onGcStat, 1000).bind(this));
  }

  static heapdump(req, res) {
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

  _onGcStat(stats) {
    var kind = {
      1: 'scavenge',
      2: 'mark-sweep',
      3: 'both'
    }[stats.gctype];

    logger.info({
      kind: kind,
      pause: stats.pause,
      cleaned: stats.diff.usedHeapSize * -1
    }, "metrics");
  }

  _sampleMemory() {
    var sample = process.memoryUsage();
    if (this._last) {
      sample.rssGrowth = sample.rss / this._last.rss;
      logger.info(sample, "metrics");
      if (sample.rssGrowth > 1.8) {
        logger.warn("RSS Growth is very high!");
      }
    }

    this._last = sample;
  }
}

export default Metrics;