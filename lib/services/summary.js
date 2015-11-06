import getDecoder from '../decoders';
import merger from '../decoders/merger';

class SummaryService {

  post(req, res) {
    // console.log("Building summary");
    merger.toLayers(getDecoder(req).toFeatures(req), function(err, layers) {
      if(err) return res.status(400).send(err.toString());

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