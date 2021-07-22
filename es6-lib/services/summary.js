import { getDecoderForContentType } from '../decoders/index.js';
import Disk from '../decoders/disk.js';
import Merger from '../decoders/merger.js';
import _ from 'underscore';
import logger from '../util/logger.js';
import DevNull from '../util/devnull.js';
import config from '../config/index.js';
const conf = config();

class SummaryService {
  _fullSummary(req) {
    //Not content length because the core http was sometimes omitting it and sometimes
    //including it? It would crash when setting it twice.
    var rSize = req.headers['x-blob-length'];
    if (!rSize) return logger.warn("X-Blob-Length omitted, going with abbreviated summary");
    return (rSize < conf.abbreviateSummarySize);
  }


  post(req, res) {
    var disk = new Disk(res, req.log);
    //;_; see the note in service/spatial for why
    //this exists
    var onErr = _.once((err) => {
      var msg;
      var status;
      if (typeof err.toJSON === 'function') {
        msg = err.toJSON();
        status = err.status();
      } else {
        logger.warn("Encountered an error that could not be jsonified.");
        if (typeof err.toString === 'function') {
          logger.error(err.toString());
        } else {
          console.log(err);
        }
        msg = "Internal Error";
        status = 500;
      }

      req.log.error(msg, "Failed to generate summary");
      return res.status(status).send(msg);
    });

    var [err, decoder] = getDecoderForContentType(req, disk);
    if (err) return onErr(err);

    var ok = (layers) => {
      res.status(200).send(JSON.stringify({
        layers: layers
      }));
    };

    if (this._fullSummary(req) && !decoder.canSummarizeQuickly()) {
      req.log.info("Making full summary");

      req
        .pipe(decoder)
        .on('error', onErr)
        .pipe(new Merger(disk, [], true, req.log))
        .on('error', onErr)
        .on('end', (layers) => {
          ok(layers.map((layer) => layer.toJSON()));
        });

    } else if (!decoder.canSummarizeQuickly()) {
      decoder.summarize((err, summary) => {
        if (err) return onErr(err);
        return ok(summary);
      });
    } else {
      req.log.info("Making abbreviated summary");

      req
        .pipe(decoder)
        .once('data', (_datum) => {
          decoder.pause();
          decoder.summarize((err, summary) => {
            if (err) return onErr(err);
            return ok(summary);
          });
        })
        .on('error', (err) => {
          if (err.code === 'EPIPE') return;
          return onErr(err);
        });
    }


  }
}

export default SummaryService;
