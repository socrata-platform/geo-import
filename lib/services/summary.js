import getDecoder from '../decoders';
import Disk from '../decoders/disk';
import Merger from '../decoders/merger';
import _ from 'underscore';
import {
  Writable
}
from 'stream';
import logger from '../util/logger';

class DevNull extends Writable {
  constructor() {
    super({
      objectMode: true
    });
  }

  _write(chunk, enc, cb) {
    setImmediate(cb);
  }
}


class SummaryService {

  constructor(config) {
    this._config = config;
  }

  _fullSummary(req) {
    var rSize = req.headers['content-length'];
    if(!rSize) return logger.warn("Content-Length omitted, going with abbreviated summary");
    return (rSize < this._config.abbreviateSummarySize);
  }


  post(req, res) {
    var disk = new Disk(res);
    //;_; see the note in service/spatial for why
    //this exists
    var onErr = _.once((err) => {
      req.log.error(err.stack);
      return res.status(400).send(err.toString());
    });

    var [err, decoder] = getDecoder(req, disk);
    if (err) return res.status(400).send(err.toString());

    var ok = (layers) => {
      res.status(200).send(JSON.stringify({
        layers: layers
      }));
    };

    if (this._fullSummary(req) && !decoder.canSummarizeQuickly()) {
      req
      .pipe(decoder)
      .on('error', onErr)
      .pipe(new Merger(disk, [], true))
      .on('error', onErr)
      .on('end', (layers) => {
        ok(layers.map((layer) => layer.toJSON()));
      });
    } else {
      decoder.on('data', (_datum) => {
        decoder.pause();
        decoder.summarize((err, summary) => {
          if (err) return res.status(400).send(JSON.stringify(err));
          return ok(summary);
        });
      });

      req
      .pipe(decoder)
      .pipe(new DevNull());
    }


  }
}

export default SummaryService;