import {
  getDecoderForExtension
}
from '../decoders';
import Merger from '../decoders/merger';
import Disk from '../decoders/disk';
import Core from '../upstream/core';
import {
  Auth
}
from '../upstream/client';
import async from 'async';
import _ from 'underscore';
import * as es from 'event-stream';
import BBox from '../util/bbox';
import {
  parseAMQMessage
}
from '../util/hacks';
import {
  types
}
from '../soql/mapper';
import Layer from '../decoders/layer';
import config from '../config';
import logger from '../util/logger';
import ISS from '../upstream/iss';
import {
  UpsertError,
  ConnectionError
}
from '../errors';
//TODO: resource scope?
import EventEmitter from 'events';


var conf = config();
const MAX_PARALLEL = 4;

function totalLayerRows(layers) {
  return layers.reduce((acc, layer) => acc + layer.count, 0);
}

class SpatialService {
  constructor(zookeeper, amq) {
    if (!zookeeper) throw new Error("SpatialService needs zookeeper!");
    if (!amq) throw new Error("SpatialService needs amq!");

    this._inFlight = 0;
    this._zk = zookeeper;
    this._onComplete = () => {
      logger.info('No jobs in progress...');
    };
    this._amq = amq;
    amq.subscribe(this._onMessage.bind(this));
  }

  _onMessage(message) {
    const saneMessage = parseAMQMessage(message);
    logger.info(saneMessage, 'Picked up an AMQ message');

    const activity = new ISS(this._amq, saneMessage);
    // const activity = iss.activity(saneMessage);
    //Send iss a start message
    activity.onStart();

    const kind = saneMessage.type.toLowerCase();
    if (kind === 'import') return this.create(activity, saneMessage);
    if (kind === 'replace') return this.replace(activity, saneMessage);
    logger.error(`Unknown message type ${kind}, discarding it`);
  }


  _createOrReplace(activity, core, layer, cb) {
    if (layer.uid === Layer.EMPTY) {
      return core.create(activity.view, layer, (err, resp) => {
        cb(err, [resp, false]);
      });
    }
    return core.replace(layer, (err, resp) => {
      cb(err, [resp, true]);
    });
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

  _destroyLayers(activity, layers, core, cb) {
    return async.map(
      layers,
      core.destroy.bind(core),
      (err, destroyResponses) => {
        return cb(err, destroyResponses);
      });
  }

  _createLayers(activity, core, layers) {
    async.mapLimit(layers, MAX_PARALLEL, _.partial(core.create, activity.view).bind(core), (err, datasetResponses) => {
      if (err) return this._onError(activity, err);
      activity.log.info(`Successfully created ${layers.length} layers`);
      _.zip(layers, datasetResponses)
        .forEach(([layer, response]) => layer.uid = response.id);
      return this._createColumns(activity, core, layers);
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
  _replaceLayers(activity, core, layers) {
    var createOrReplace = (layers, cb) => {
      async.mapLimit(
        layers,
        MAX_PARALLEL,
        _.partial(this._createOrReplace, activity, core), (err, responses) => {
          if (err) return cb(err);
          var replacements = _.flatten(
            _.zip(layers, responses)
            .map(([layer, [response, isReplace]]) => {
              var newUid = response.id;
              if (isReplace) {
                activity.log.info(`Going to replace ${layer.uid} with new copy ${newUid}`);
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
            return response.map((col) => [layer.uid, col.id]);
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
      if (err) return this._onError(activity, err);
      return this._createColumns(activity, core, newLayers);
    });
  }


  _createColumns(activity, core, layers) {
    var colSpecs = this._flatColSpecs(layers);
    //only make MAX_PARALLEL requests in parallel. core will die if we do a bunch.
    return async.mapLimit(colSpecs, MAX_PARALLEL, core.addColumn.bind(core), (err, colResponses) => {
      if (err) {
        return this._destroyLayers(activity, layers, core, () => {
          return this._onError(activity, err);
        });
      }
      activity.log.info(`Successfully created ${colResponses.length} columns`);
      return this._upsertLayers(activity, core, layers);
    });
  }


  /**
   * Take all the bounding boxes from the layers and make a bounding box
   * that encompasses all of them
   * @param  [layer]
   * @return {[BBox]}              m e g a  b b o x
   */
  _expandBbox(layerResults) {
    return layerResults.reduce((wholeBbox, {
      bbox: bbox
    }) => {
      return wholeBbox.merge(bbox);
    }, new BBox());
  }


  _upsertLayers(activity, core, layers) {
    var fail = _.once((reason) => {
      this._destroyLayers(activity, layers, core, () => {
        this._onError(activity, reason);
      });
    });

    var totalRowsUpserted = 0;
    const totalRows = totalLayerRows(layers);

    const sendProgress = _.throttle(() => {
      activity.log.info(`Completed ${totalRowsUpserted} rows of ${totalRows}, sending ISS event`);
      activity.onProgress(totalRowsUpserted, totalRows);
    }, conf.debounceProgressMs);

    //this is a little different than the two preceding core calls. core.upsert
    //just sets up the request, so the callback will
    //return to the finish callback a list of *open* requests, rather than completed
    //requests, as well as the corresponding layer. Then we need to pipe the
    //layer's scratch file to the open request
    return async.map(layers, core.upsert.bind(core), (err, upserts) => {
      if (err) return fail(err);
      activity.log.info(`Created upsert requests`);

      return async.map(upserts, ([layer, startUpsert], onUpsertComplete) => {
        onUpsertComplete = _.once(onUpsertComplete);

        activity.log.info(`Starting upsert to ${layer.uid}`);
        var upsertRequest = startUpsert();
        layer
          .on('error', fail)
          .pipe(es.map(function(datum, callback) {
            callback(null, datum);
            totalRowsUpserted++;
            if ((totalRowsUpserted % conf.emitProgressEveryRows) === 0) {
              sendProgress();
            }
          }))
          .pipe(upsertRequest)
          .on('response', core.bufferResponse(
            (error, body) => {
              if (error) {
                activity.log.error(error);
                return onUpsertComplete(error);
              }
              return onUpsertComplete(false, [layer, body]);
            },
            UpsertError
          ))
          .on('error', (error) => {
            const connectError = new ConnectionError(`Core: ${error.code}`);
            //The underlying stream will throw an error if
            //  * we can't parse the scratch file
            //  * some IO error happens
            activity.log.error(connectError.toJSON());
            upsertRequest.abort();

            return onUpsertComplete(connectError);
          });

      }, (err, upsertResponses) => {
        if (err) {
          activity.log.error(err.toJSON(), 'Upsert Failed!');
          return fail(err);
        }

        const layers = upsertResponses.map(([layer, _]) => layer);
        activity.log.info(`Successfully upserted ${layers.map((l) => l.uid)}`);
        this._publishLayers(activity, core, layers);
      });
    });
  }

  _publishLayers(activity, core, layers) {
    return async.mapLimit(
      layers,
      MAX_PARALLEL,
      core.publish.bind(core),
      (err, publications) => {
        if (err) {
          return this._destroyLayers(activity, layers, core, () => {
            return this._onError(activity, err);
          });
        }
        activity.log.info(`Successfully published ${layers.map(l => l.uid)}`);
        const publishedLayers = _.zip(layers, publications).map(([layer, response]) => {
          activity.log.info(`Publication resulted in ${layer.uid} --> ${response.id}`);
          layer.uid = response.id;
          return layer;
        });
        return this._updateParentMetadata(activity, core, publishedLayers);
      }
    );
  }

  _updateParentMetadata(activity, core, layers) {
    const bbox = this._expandBbox(layers);
    const warnings = [];
    const totalRows = totalLayerRows(layers);
    core.updateMetadata(activity.getParentUid(), layers, bbox, (err, resp) => {
      if (err) {
        return this._destroyLayers(activity, layers, core, () => {
          return this._onError(activity, err);
        });
      }
      activity.log.info(`Updated metadata for ${activity.getParentUid()} : ${resp}`);
      activity.onSuccess(warnings, totalRows);

      return this._endProgress();
    });
  }

  _readShapeBlob(activity, message, onEnd) {
    const auth = new Auth(message);
    const core = new Core(auth, this._zk, activity.log);
    const disk = new Disk(activity, activity.log);

    //;_;
    //Because node's error handling is just wtf, we need
    //to bind to error events or else an error is thrown,
    //but we need to do it once because we close the req.
    //This means we can't just use `.once`, because we
    //need to do *something* on all of them. so we bind
    //with `.on` with a method that noops after one call
    var onErr = _.once((err) => {
      return this._onError(activity, err);
    });

    //If we can't get a decoder, then the user tried to import
    //an unsupported file, or set the content type incorrectly
    //on their header
    var [decoderErr, decoder] = getDecoderForExtension(message.filename, disk);
    if (decoderErr) return this._onError(activity, decoderErr);

    core.getBlob(message.blobId, (err, stream) => {
      if (err) return onErr(err);

      var specs = this._toLayerSpecs(message.script);
      activity.log.info(`Create layers according to ${JSON.stringify(specs)}`);

      stream
        .on('error', (error) => {
          onErr(new ConnectionError(`Core: ${error.code}`));
        })
        .pipe(decoder)
        .on('error', onErr)
        .pipe(new Merger(disk, specs, false, activity.log))
        .on('error', onErr)
        .on('end', (layers) => onEnd(core, layers));
    });
  }

  _toLayerSpecs(script) {
    return script.layers.map(l => {
      return {
        name: l.name,
        uid: l.replacingUid
      };
    });
  }

  _onError(activity, reason) {
    activity.onError(reason);
    this._endProgress();
  }

  _endProgress() {
    if (this._inFlight > 0) {
      this._inFlight--;
    }
    if (this._inFlight === 0) {
      this._onComplete();
    }
  }

  _startProgress() {
    this._inFlight++;
  }

  create(activity, message) {
    this._startProgress();
    this._readShapeBlob(activity, message, (core, layers) => {
      activity.log.info("Done reading shape blob, starting create");
      this._createLayers(activity, core, layers);
    });
  }

  replace(activity, message) {
    this._startProgress();
    this._readShapeBlob(activity, message, (core, layers) => {
      activity.log.info("Done reading shape blob, starting replace");
      this._replaceLayers(activity, core, layers);
    });
  }

  close(cb) {
    logger.info("SpatialService is supposed to close");
    this._amq.disconnect();

    this._onComplete = () => {
      logger.info(`Spatial service received a close, exiting in ${conf.shutdownDrainMs}ms`);
      setTimeout(cb, conf.shutdownDrainMs);
    };
    if (this._inFlight === 0) {
      this._onComplete();
    }
  }


}

export
default SpatialService;