import getDecoder from '../decoders';
import merger from '../decoders/merger';


class SummaryService {




  post(req, res) {
    merger.toLayers(getDecoder(req).toFeatures(req), function(err, layers) {
      if(err) return res.status(400).send(err.toString());
      var summary = layers.map((layer) => {
        return {
          features: layer.count,
          projection: layer.defaultCrs.pretty_wkt,
          name: layer.name,
          geometry: layer.geomType
        };
      });
      res.status(200).send(JSON.stringify(summary));
    }.bind(this));


  }
}

export default SummaryService;