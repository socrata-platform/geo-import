import getDecoder from '../decoders';
import Disk from '../decoders/disk';
import Merger from '../decoders/merger';
import _ from 'underscore';

class SummaryService {

  post(req, res) {
    var disk = new Disk(res);
    //;_; see the note in service/spatial for why
    //this exists
    var onErr = _.once((err) => {
      req.log.error(err.stack);
      return res.status(400).send(err.toString());
    });

    var [err, decoder] = getDecoder(req, disk);
    if(err) return res.status(400).send(err.toString());

    req
    .pipe(decoder)
    .on('error', onErr)
    .pipe(new Merger(disk))
    .on('error', onErr)
    .on('end', (layers) => {
      var layerSummary = layers.map((layer) => layer.toJSON());
      var summary = {
        layers: layerSummary
      };
      res.status(200).send(JSON.stringify(summary));
    });
  }
}

export default SummaryService;