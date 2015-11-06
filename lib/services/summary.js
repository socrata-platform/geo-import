import getDecoder from '../decoders';
import Merger from '../decoders/merger';

class SummaryService {

  post(req, res) {
    req
    .pipe(getDecoder(req))
    .pipe(new Merger())
    .on('error', (err) => {
      return res.status(400).send(err.toString());
    })
    .on('end', (layers) => {
      var layerSummary = layers.map((layer) => {
        return {
          features: layer.count,
          projection: layer.defaultCrs.pretty_wkt,
          name: layer.name,
          geometry: layer.geomType
        };
      });
      var summary = {
        layers: layerSummary
      }
      // console.log(`Built summary for ${summary.layers.length} layers`);
      res.status(200).send(JSON.stringify(summary));
    }.bind(this));
  }
}

export default SummaryService;