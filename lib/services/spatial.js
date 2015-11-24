import getDecoder from '../decoders';
import Merger from '../decoders/merger';
import Disk from '../decoders/disk';
import {
  Core, CoreAuth
}
from '../upstream/core';
import async from 'async';
import _ from 'underscore';
import * as es from 'event-stream';
import BBox from '../util/bbox';
import {
  types
}
from '../soql/mapper';


class SpatialService {
  constructor(zookeeper) {
    if (!zookeeper) throw new Error("SpatialService needs zookeeper!");
    this._zk = zookeeper;
  }


  _createLayers(req, res, core, layers) {
    async.map(layers, core.create.bind(core), (err, datasetResponses) => {
      //failed to get upstream from zk or create request failed
      if (err) return res.status(err.statusCode).send(err.body);
      return this._createColumns(req, res, core, _.zip(layers, datasetResponses));
    });
  }


  _createColumns(req, res, core, datasets) {
    var colSpecs = _.flatten(datasets.map(([layer, dataset]) => {
      var fourfour = dataset.body.id;
      return layer.columns.map((col) => [fourfour, col]);
    }), true);

    return async.map(colSpecs, core.addColumn.bind(core), (err, colResponses) => {
      if (err) return res.status(err.statusCode).send(err.body);
      return this._upsertLayers(req, res, core, datasets);
    });
  }

  /**
   * Take all the bounding boxes from the layers and make a bounding box
   * that encompasses all of them
   * @param  {} layerResults       results from layer upsert
   * @return {[BBox]}              m e g a  b b o x
   */
  _expandBbox(layerResults) {
    return layerResults.reduce((wholeBbox, {layer: {bbox: bbox}}) => {
      return wholeBbox.merge(bbox);
    }, new BBox());
  }


  _upsertLayers(req, res, core, datasets) {
    var upsertSpecs = datasets.map(([layer, ds]) => [layer, ds.body.id]);
    req.log.debug(`upsert specs ${upsertSpecs}`);
    //this is a little different than the two preceding core calls. core.upsert
    //just sets up the request, so the callback will
    //return to the finish callback a list of *open* requests, rather than completed
    //requests, as well as the corresponding layer. Then we need to pipe the
    //layer's scratch file to the open request
    return async.map(upsertSpecs, core.upsert.bind(core), (err, upsert) => {
      if(err) return res.status(503).send(err);

      return async.map(upsert, ([[layer, fourfour], upsertBuilder], cb) => {
        req.log.info(`Starting upsert to ${fourfour}`);
        layer.pipe(upsertBuilder())
          .on('response', (upsertResponse) => {
            req.log.info(`Got upsert response ${upsertResponse.statusCode}`);
            //bb hack to match the rest of the flow
            core.bufferResponse((bufferedResponse) => {
              if (bufferedResponse.statusCode > 300) return cb(bufferedResponse);
              return cb(false, [
                [layer, fourfour], bufferedResponse
              ]);
            })(upsertResponse);
          })
          .on('error', (err) => {
            //The underlying stream will throw an error if
            //  * we can't parse the scratch file
            //  * some IO error happens
            //
            //It's important to munge this error so core doesn't
            //get blamed for a local exception
            upsertRequest.abort();
            cb({
              statusCode: 500,
              body: err
            });
          });

      }, (err, upsertResponses) => {
        if (err) return res.status(err.statusCode || 503).send(err.body);

        var layerResults = upsertResponses.map(([
          [layer, fourfour], response
        ]) => {
          return {
            'uid': fourfour,
            'layer': layer.toJSON()
          };
        });
        var upsertResult = {
          bbox: this._expandBbox(layerResults),
          layers: layerResults
        };

        //logthis
        req.log.info(`Successfully upserted ${layerResults.map((l) => l.uid)} with ${layerResults.map((l) => l.create)} features`);

        return res.status(200).send(upsertResult);
      });
    });
  }

  post(req, res) {
    var auth = new CoreAuth(req);
    var core = new Core(auth, this._zk);
    var disk = new Disk(res);

    //;_;
    //Because node's error handling is just wtf, we need
    //to bind to error events or else an error is thrown,
    //but we need to do it once because we close the req.
    //This means we can't just use `.once`, because we
    //need to do *something* on all of them. so we bind
    //with `.on` with a method that noops after one call
    var onErr = _.once((err) => {
      req.log.error(err.stack);
      //TODO: this shouldn't be hardcoded as a 400, errors should carry their
      //own reponse code
      return res.status(400).send(err.toString());
    });

    //If we can't get a decoder, then the user tried to import
    //an unsupported file, or set the content type incorrectly
    //on their header
    var [err, decoder] = getDecoder(req, disk);
    if(err) return res.status(400).send(err.toString());

    req
    .pipe(decoder)
    .on('error', onErr)
    .pipe(new Merger(disk))
    .on('error', onErr)
    .on('end', (layers) => {
      return this._createLayers(req, res, core, layers);
    });
  }
}



export default SpatialService;