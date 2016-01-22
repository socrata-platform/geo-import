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
import Layer from '../decoders/layer';
import config from '../config';

var conf = config();
const MAX_PARALLEL = 4;

class SpatialService {
  constructor(zookeeper) {
    if (!zookeeper) throw new Error("SpatialService needs zookeeper!");
    this._zk = zookeeper;
  }


  _createOrReplace(core, layer) {
    return (layer, cb) => {
      if (layer.uid === Layer.EMPTY) {
        return core.create(layer, (err, resp) => {
          cb(err, [resp, false]);
        });
      }
      return core.replace(layer, (err, resp) => {
        cb(err, [resp, true]);
      });
    };
  }

  /**
   * Helper for turning a list of layers into a flat list of
   * [layerUid, column] tuples
   */
  _flatColSpecs(layers) {
    return _.flatten(layers.map((layer) => {
      return layer.columns.map((col) => [layer.uid, col]);
    }), true);
  }

  _destroyLayers(layers, core, cb) {
    return async.map(layers, core.destroy.bind(core), (err, destroyResponses) => {
      return cb(err, destroyResponses);
    });
  }

  _createLayers(req, res, core, layers) {
    async.mapLimit(layers, MAX_PARALLEL, core.create.bind(core), (err, datasetResponses) => {
      //failed to get upstream from zk or create request failed
      if (err) return res.status(err.statusCode || 500).send(err.body || err.toString());
      req.log.info(`Successfully created ${layers.length} layers`);
      _.zip(layers, datasetResponses)
        .forEach(([layer, response]) => layer.uid = response.body.id);
      return this._createColumns(req, res, core, layers);
    });
  }

  /**
   * Replace the layers in core.
   * This will
   *   Create or replace the layers
   *     create a layer if the id in the layer is __empty__
   *     replace a layer if the id in the layer is a uid
   *
   *     These IDs are passed in from the client (core), which
   *     ultimately is made up from the `blueprint`
   *
   *   Get the columns for each layer that resulted in a copy
   *   of the schema to a new view (ie: a replace) and flatten that
   *   into a list of [viewFourFour, columnId] tuples
   *
   *   Delete all those columns that were just returned, because we need
   *   to re-create them as columns can be dropped or added
   *
   *   Resume the normal flow, as we now have a list of layers that have
   *   been created in the datastore with an empty set of columns for each
   *
   */
  _replaceLayers(req, res, core, layers) {
    var createOrReplace = (layers, cb) => {
      async.mapLimit(layers, MAX_PARALLEL, this._createOrReplace(core), (err, responses) => {
        if (err) return cb(err);
        var replacements = _.flatten(
          _.zip(layers, responses)
          .map(([layer, [response, isReplace]]) => {
            var newUid = response.body.id;
            if (isReplace) {
              req.log.info(`Going to replace ${layer.uid} with new copy ${newUid}`);
            }
            layer.uid = newUid;
            return [layer, isReplace];
          })
          .filter(([_layer, isReplace]) => isReplace)
          .map(([layer, _isReplace]) => layer));
        cb(false, replacements);
      });
    };

    var flatColumns = (replacements, cb) => {
      async.mapLimit(replacements, MAX_PARALLEL, core.getColumns.bind(core), (err, responses) => {
        if (err) return cb(err);
        var colSpecs = _.flatten(
          _.zip(replacements, responses).map(([layer, response]) => {
            return response.body.map((col) => [layer.uid, col.id]);
          }), true);
        cb(false, colSpecs);
      });
    };

    var deleteColumns = (colSpecs, cb) => {
      async.mapLimit(colSpecs, MAX_PARALLEL, core.deleteColumn.bind(core), (err, responses) => {
        if (err) return cb(err);
        cb(false, layers);
      });
    };

    async.seq(createOrReplace, flatColumns, deleteColumns)(layers, (err, newLayers) => {
      if (err) {
        return this._destroyLayers(layers, core, () => {
          return res.status(err.statusCode || 500).send(err.body || err.toString());
        });
      }
      return this._createColumns(req, res, core, newLayers);
    });
  }


  _createColumns(req, res, core, layers) {
    var colSpecs = this._flatColSpecs(layers);
    //only make MAX_PARALLEL requests in parallel. core will die if we do a bunch.
    return async.mapLimit(colSpecs, MAX_PARALLEL, core.addColumn.bind(core), (err, colResponses) => {
      if (err) {
        return this._destroyLayers(layers, core, () => {
          res.status(err.statusCode || 500).send(err.body || err.toString());
        });
      }
      req.log.info(`Successfully created ${colResponses.length} columns`);
      return this._upsertLayers(req, res, core, layers);
    });
  }


  /**
   * Take all the bounding boxes from the layers and make a bounding box
   * that encompasses all of them
   * @param  {} layerResults       results from layer upsert
   * @return {[BBox]}              m e g a  b b o x
   */
  _expandBbox(layerResults) {
    return layerResults.reduce((wholeBbox, {
      layer: {
        bbox: bbox
      }
    }) => {
      return wholeBbox.merge(bbox);
    }, new BBox());
  }


  _upsertLayers(req, res, core, layers) {
    var fail = _.once((code, reason) => {
      this._destroyLayers(layers, core, () => {
        res.status(code).send(reason);
      });
    });

    //this is a little different than the two preceding core calls. core.upsert
    //just sets up the request, so the callback will
    //return to the finish callback a list of *open* requests, rather than completed
    //requests, as well as the corresponding layer. Then we need to pipe the
    //layer's scratch file to the open request
    return async.map(layers, core.upsert.bind(core), (err, upsert) => {
      req.log.info(`Created upsert requests`);
      if (err) return fail(503, err.toString());

      return async.map(upsert, ([layer, upsertBuilder], cb) => {
        cb = _.once(cb);

        req.log.info(`Starting upsert to ${layer.uid}`);
        var upsertRequest = upsertBuilder();
        layer
          .pipe(upsertRequest)
          .on('response', (upsertResponse) => {
            req.log.info(`Got upsert response ${upsertResponse.statusCode}`);
            //bb hack to match the rest of the flow
            core.bufferResponse((bufferedResponse) => {
              req.log.info(`Finished upsert response ${upsertResponse.statusCode}`);
              if (bufferedResponse.statusCode > 300) {
                req.log.error(`Core returned upsert error: ${bufferedResponse}`);
                return cb({
                  statusCode: 503,
                  reason: "Upstream Error",
                  layer: layer
                });
              }
              return cb(false, [layer, bufferedResponse]);
            })(upsertResponse);
          })
          .on('error', (err) => {
            //The underlying stream will throw an error if
            //  * we can't parse the scratch file
            //  * some IO error happens
            //
            //It's important to munge this error so core doesn't
            //get blamed for a local exception
            req.log.error(err.toString());
            upsertRequest.abort();
            return cb({
              statusCode: 500,
              reason: "Internal Error",
              layer: layer
            });
          });

      }, (err, upsertResponses) => {
        if (err) {
          req.log.error(`Upsert failed for layer ${err.layer.name} ${err.layer.uid} with ${JSON.stringify(err.reason)} in ${err.layer.scratchName}`);
          return fail(err.statusCode, err.reason);
        }

        var layerResults = upsertResponses.map(([layer, response]) => {
          return {
            'uid': layer.uid,
            'layer': layer.toJSON()
          };
        });
        var upsertResult = {
          bbox: this._expandBbox(layerResults),
          layers: layerResults
        };

        req.log.info(`Successfully upserted ${layerResults.map((l) => l.uid)} with ${layerResults.map((l) => l.create)} features`);
        return res.status(200).send(upsertResult);
      });
    });
  }

  _readShapeBlob(req, res, onEnd) {
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
    var [decoderErr, decoder] = getDecoder(req, disk);
    if (decoderErr) return res.status(400).send(decoderErr.toString());

    var [mungeErr, specs] = this._mungeLayerSpecs(req);
    if (mungeErr) return res.status(400).send(mungeErr.toString());

    req.log.info(`Create layers according to ${JSON.stringify(specs)}`);

    req
      .pipe(decoder)
      .on('error', onErr)
      .pipe(new Merger(disk, specs, false, conf.maxVerticesPerRow))
      .on('error', onErr)
      .on('end', (layers) => {
        onEnd(core, layers);
      });
  }

  _mungeLayerSpecs(req) {
    //need to wrap the layer spec in a list if it's defined and is one element
    var names = [];
    var uids = [];
    if (_.isArray(req.query.names)) {
      names = req.query.names;
    } else if (!_.isUndefined(req.query.names)) {
      names = [req.query.names];
    }
    var fourfours = (req.params.fourfours || '').split(',').filter((ff) => ff);
    return [false, _.zip(names, fourfours).map(([name, uid]) => {
      return {
        name: name,
        uid: uid
      };
    })];
  }

  create(req, res) {
    req.log.info("Starting create of the dataset");
    this._readShapeBlob(req, res, (core, layers) => {
      req.log.info("Done reading shape blob, creating layers");
      return this._createLayers(req, res, core, layers);
    });
  }

  replace(req, res) {
    req.log.info("Starting replace of the dataset");
    this._readShapeBlob(req, res, (core, layers) => {
      req.log.info("Done reading shape blob, replacing layers");
      return this._replaceLayers(req, res, core, layers);
    });
  }
}



export default SpatialService;