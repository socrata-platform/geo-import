import logger from './logger';
import heapdump from 'heapdump';



class Metrics {
  constructor() {
    setInterval(this._sampleMemory.bind(this), 1000);
  }

  _sampleMemory() {

    var sample = process.memoryUsage();

    if(this._last) {
      sample.rssGrowth = sample.rss / this._last.rss;
      logger.info(sample, "metrics");

      if(sample.rssGrowth > 1.8) {
        logger.warn("Making heapdump!");
        heapdump.writeSnapshot();
      }
    }

    this._last = sample;
  }
}

export default Metrics;