import logger from './logger';
import heapdump from 'heapdump';
import fs from 'fs';
import path from 'path';

class Metrics {
  constructor() {
    setInterval(this._sampleMemory.bind(this), 1000);
  }

  static heapdump(req, res) {
    req.log.info('Making a heapdump');
    heapdump.writeSnapshot((err, filename) => {
      if (err) return res.status(500).send(err.toString());
      req.log.info(`Wrote heapdump to ${filename}`);
      fs.createReadStream(path.join(__dirname, '../..', filename))
        .pipe(res
          .status(200)
          .set('content-type', 'application/octet-stream')
          .set('content-disposition', `inline; filename="${filename}"`))
        .on('end', () => fs.unlink(filename));
    });
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