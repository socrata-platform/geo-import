import GeoJSON from '../decoders/geojson';
import * as merger from '../decoders/merger';
import {Core, CoreAuth} from '../upstream/core';
import async from 'async';
import _ from 'underscore';

function getDecoder(req) {
  return new GeoJSON();
}


class SpatialService {
  constructor(zookeeper) {
    if(!zookeeper) throw new Error("SpatialService needs zookeeper!");
    this._zk = zookeeper;
  }

  post(req, res) {
    var auth = new CoreAuth(req);
    var core = new Core(auth, this._zk);

    merger.toLayers(getDecoder(req).toFeatures(req), function(err, layers) {

      async.map(layers, core.create.bind(core), (err, results) => {
        //failed to get upstream from zk
        if(err) return res.status(err.statusCode).send(err.body);

        res.status(202).send("hi");
      }.bind(this));
    }.bind(this));
  }
}




export default SpatialService;