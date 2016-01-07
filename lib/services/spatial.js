'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }; })();

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _decoders = require('../decoders');

var _decoders2 = _interopRequireDefault(_decoders);

var _decodersMerger = require('../decoders/merger');

var _decodersMerger2 = _interopRequireDefault(_decodersMerger);

var _decodersDisk = require('../decoders/disk');

var _decodersDisk2 = _interopRequireDefault(_decodersDisk);

var _upstreamCore = require('../upstream/core');

var _async = require('async');

var _async2 = _interopRequireDefault(_async);

var _underscore = require('underscore');

var _underscore2 = _interopRequireDefault(_underscore);

var _eventStream = require('event-stream');

var es = _interopRequireWildcard(_eventStream);

var _utilBbox = require('../util/bbox');

var _utilBbox2 = _interopRequireDefault(_utilBbox);

var _soqlMapper = require('../soql/mapper');

var _decodersLayer = require('../decoders/layer');

var _decodersLayer2 = _interopRequireDefault(_decodersLayer);

var MAX_PARALLEL = 4;

var SpatialService = (function () {
  function SpatialService(zookeeper) {
    _classCallCheck(this, SpatialService);

    if (!zookeeper) throw new Error("SpatialService needs zookeeper!");
    this._zk = zookeeper;
  }

  _createClass(SpatialService, [{
    key: '_createOrReplace',
    value: function _createOrReplace(core, layer) {
      return function (layer, cb) {
        if (layer.uid === _decodersLayer2['default'].EMPTY) {
          return core.create(layer, function (err, resp) {
            cb(err, [resp, false]);
          });
        }
        return core.replace(layer, function (err, resp) {
          cb(err, [resp, true]);
        });
      };
    }

    /**
     * Helper for turning a list of layers into a flat list of
     * [layerUid, column] tuples
     */
  }, {
    key: '_flatColSpecs',
    value: function _flatColSpecs(layers) {
      return _underscore2['default'].flatten(layers.map(function (layer) {
        return layer.columns.map(function (col) {
          return [layer.uid, col];
        });
      }), true);
    }
  }, {
    key: '_destroyLayers',
    value: function _destroyLayers(layers, core, cb) {
      return _async2['default'].map(layers, core.destroy.bind(core), function (err, destroyResponses) {
        return cb(err, destroyResponses);
      });
    }
  }, {
    key: '_createLayers',
    value: function _createLayers(req, res, core, layers) {
      var _this = this;

      _async2['default'].mapLimit(layers, MAX_PARALLEL, core.create.bind(core), function (err, datasetResponses) {
        //failed to get upstream from zk or create request failed
        if (err) return res.status(err.statusCode || 500).send(err.body || err.toString());
        req.log.info('Successfully created ' + layers.length + ' layers');
        _underscore2['default'].zip(layers, datasetResponses).forEach(function (_ref) {
          var _ref2 = _slicedToArray(_ref, 2);

          var layer = _ref2[0];
          var response = _ref2[1];
          return layer.uid = response.body.id;
        });
        return _this._createColumns(req, res, core, layers);
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
  }, {
    key: '_replaceLayers',
    value: function _replaceLayers(req, res, core, layers) {
      var _this2 = this;

      var createOrReplace = function createOrReplace(layers, cb) {
        _async2['default'].mapLimit(layers, MAX_PARALLEL, _this2._createOrReplace(core), function (err, responses) {
          if (err) return cb(err);
          var replacements = _underscore2['default'].flatten(_underscore2['default'].zip(layers, responses).map(function (_ref3) {
            var _ref32 = _slicedToArray(_ref3, 2);

            var layer = _ref32[0];

            var _ref32$1 = _slicedToArray(_ref32[1], 2);

            var response = _ref32$1[0];
            var isReplace = _ref32$1[1];

            var newUid = response.body.id;
            if (isReplace) {
              req.log.info('Going to replace ' + layer.uid + ' with new copy ' + newUid);
            }
            layer.uid = newUid;
            return [layer, isReplace];
          }).filter(function (_ref4) {
            var _ref42 = _slicedToArray(_ref4, 2);

            var _layer = _ref42[0];
            var isReplace = _ref42[1];
            return isReplace;
          }).map(function (_ref5) {
            var _ref52 = _slicedToArray(_ref5, 2);

            var layer = _ref52[0];
            var _isReplace = _ref52[1];
            return layer;
          }));
          cb(false, replacements);
        });
      };

      var flatColumns = function flatColumns(replacements, cb) {
        _async2['default'].mapLimit(replacements, MAX_PARALLEL, core.getColumns.bind(core), function (err, responses) {
          if (err) return cb(err);
          var colSpecs = _underscore2['default'].flatten(_underscore2['default'].zip(replacements, responses).map(function (_ref6) {
            var _ref62 = _slicedToArray(_ref6, 2);

            var layer = _ref62[0];
            var response = _ref62[1];

            return response.body.map(function (col) {
              return [layer.uid, col.id];
            });
          }), true);
          cb(false, colSpecs);
        });
      };

      var deleteColumns = function deleteColumns(colSpecs, cb) {
        _async2['default'].mapLimit(colSpecs, MAX_PARALLEL, core.deleteColumn.bind(core), function (err, responses) {
          if (err) return cb(err);
          cb(false, layers);
        });
      };

      _async2['default'].seq(createOrReplace, flatColumns, deleteColumns)(layers, function (err, newLayers) {
        if (err) {
          return _this2._destroyLayers(layers, core, function () {
            return res.status(err.statusCode || 500).send(err.body || err.toString());
          });
        }
        return _this2._createColumns(req, res, core, newLayers);
      });
    }
  }, {
    key: '_createColumns',
    value: function _createColumns(req, res, core, layers) {
      var _this3 = this;

      var colSpecs = this._flatColSpecs(layers);
      //only make MAX_PARALLEL requests in parallel. core will die if we do a bunch.
      return _async2['default'].mapLimit(colSpecs, MAX_PARALLEL, core.addColumn.bind(core), function (err, colResponses) {
        if (err) {
          return _this3._destroyLayers(layers, core, function () {
            res.status(err.statusCode || 500).send(err.body || err.toString());
          });
        }
        req.log.info('Successfully created ' + colResponses.length + ' columns');
        return _this3._upsertLayers(req, res, core, layers);
      });
    }

    /**
     * Take all the bounding boxes from the layers and make a bounding box
     * that encompasses all of them
     * @param  {} layerResults       results from layer upsert
     * @return {[BBox]}              m e g a  b b o x
     */
  }, {
    key: '_expandBbox',
    value: function _expandBbox(layerResults) {
      return layerResults.reduce(function (wholeBbox, _ref7) {
        var bbox = _ref7.layer.bbox;

        return wholeBbox.merge(bbox);
      }, new _utilBbox2['default']());
    }
  }, {
    key: '_upsertLayers',
    value: function _upsertLayers(req, res, core, layers) {
      var _this4 = this;

      var fail = _underscore2['default'].once(function (code, reason) {
        _this4._destroyLayers(layers, core, function () {
          res.status(code).send(JSON.stringify(reason));
        });
      });

      //this is a little different than the two preceding core calls. core.upsert
      //just sets up the request, so the callback will
      //return to the finish callback a list of *open* requests, rather than completed
      //requests, as well as the corresponding layer. Then we need to pipe the
      //layer's scratch file to the open request
      return _async2['default'].map(layers, core.upsert.bind(core), function (err, upsert) {
        req.log.info('Created upsert requests');
        if (err) return fail(503, {
          message: err.toString()
        });

        return _async2['default'].map(upsert, function (_ref8, cb) {
          var _ref82 = _slicedToArray(_ref8, 2);

          var layer = _ref82[0];
          var upsertBuilder = _ref82[1];

          cb = _underscore2['default'].once(cb);

          req.log.info('Starting upsert to ' + layer.uid);
          var upsertRequest = upsertBuilder();
          layer.pipe(upsertRequest).on('response', function (upsertResponse) {
            req.log.info('Got upsert response ' + upsertResponse.statusCode);
            //bb hack to match the rest of the flow
            core.bufferResponse(function (bufferedResponse) {
              req.log.info('Finished upsert response ' + upsertResponse.statusCode);
              if (bufferedResponse.statusCode > 300) {
                return cb({
                  statusCode: 503,
                  reason: bufferedResponse.body,
                  layer: layer
                });
              }
              return cb(false, [layer, bufferedResponse]);
            })(upsertResponse);
          }).on('error', function (err) {
            //The underlying stream will throw an error if
            //  * we can't parse the scratch file
            //  * some IO error happens
            //
            //It's important to munge this error so core doesn't
            //get blamed for a local exception
            upsertRequest.abort();
            return cb({
              statusCode: 500,
              body: err.toString(),
              layer: layer
            });
          });
        }, function (err, upsertResponses) {
          if (err) {
            req.log.error('Upsert failed for layer ' + err.layer.name + ' ' + err.layer.uid + ' with ' + JSON.stringify(err.reason) + ' in ' + err.layer.scratchName);
            return fail(err.statusCode, err.reason);
          }

          var layerResults = upsertResponses.map(function (_ref9) {
            var _ref92 = _slicedToArray(_ref9, 2);

            var layer = _ref92[0];
            var response = _ref92[1];

            return {
              'uid': layer.uid,
              'layer': layer.toJSON()
            };
          });
          var upsertResult = {
            bbox: _this4._expandBbox(layerResults),
            layers: layerResults
          };

          req.log.info('Successfully upserted ' + layerResults.map(function (l) {
            return l.uid;
          }) + ' with ' + layerResults.map(function (l) {
            return l.create;
          }) + ' features');
          return res.status(200).send(upsertResult);
        });
      });
    }
  }, {
    key: '_readShapeBlob',
    value: function _readShapeBlob(req, res, onEnd) {
      var auth = new _upstreamCore.CoreAuth(req);
      var core = new _upstreamCore.Core(auth, this._zk);
      var disk = new _decodersDisk2['default'](res);

      //;_;
      //Because node's error handling is just wtf, we need
      //to bind to error events or else an error is thrown,
      //but we need to do it once because we close the req.
      //This means we can't just use `.once`, because we
      //need to do *something* on all of them. so we bind
      //with `.on` with a method that noops after one call
      var onErr = _underscore2['default'].once(function (err) {
        req.log.error(err.stack);
        //TODO: this shouldn't be hardcoded as a 400, errors should carry their
        //own reponse code
        return res.status(400).send(err.toString());
      });

      //If we can't get a decoder, then the user tried to import
      //an unsupported file, or set the content type incorrectly
      //on their header

      var _getDecoder = (0, _decoders2['default'])(req, disk);

      var _getDecoder2 = _slicedToArray(_getDecoder, 2);

      var decoderErr = _getDecoder2[0];
      var decoder = _getDecoder2[1];

      if (decoderErr) return res.status(400).send(decoderErr.toString());

      var _mungeLayerSpecs2 = this._mungeLayerSpecs(req);

      var _mungeLayerSpecs22 = _slicedToArray(_mungeLayerSpecs2, 2);

      var mungeErr = _mungeLayerSpecs22[0];
      var specs = _mungeLayerSpecs22[1];

      if (mungeErr) return res.status(400).send(mungeErr.toString());

      req.log.info('Create layers according to ' + JSON.stringify(specs));

      req.pipe(decoder).on('error', onErr).pipe(new _decodersMerger2['default'](disk, specs, false)).on('error', onErr).on('end', function (layers) {
        onEnd(core, layers);
      });
    }
  }, {
    key: '_mungeLayerSpecs',
    value: function _mungeLayerSpecs(req) {
      //need to wrap the layer spec in a list if it's defined and is one element
      var names = [];
      var uids = [];
      if (_underscore2['default'].isArray(req.query.names)) {
        names = req.query.names;
      } else if (!_underscore2['default'].isUndefined(req.query.names)) {
        names = [req.query.names];
      }
      var fourfours = (req.params.fourfours || '').split(',').filter(function (ff) {
        return ff;
      });
      return [false, _underscore2['default'].zip(names, fourfours).map(function (_ref10) {
        var _ref102 = _slicedToArray(_ref10, 2);

        var name = _ref102[0];
        var uid = _ref102[1];

        return {
          name: name,
          uid: uid
        };
      })];
    }
  }, {
    key: 'create',
    value: function create(req, res) {
      var _this5 = this;

      req.log.info("Starting create of the dataset");
      this._readShapeBlob(req, res, function (core, layers) {
        req.log.info("Done reading shape blob, creating layers");
        return _this5._createLayers(req, res, core, layers);
      });
    }
  }, {
    key: 'replace',
    value: function replace(req, res) {
      var _this6 = this;

      req.log.info("Starting replace of the dataset");
      this._readShapeBlob(req, res, function (core, layers) {
        req.log.info("Done reading shape blob, replacing layers");
        return _this6._replaceLayers(req, res, core, layers);
      });
    }
  }]);

  return SpatialService;
})();

exports['default'] = SpatialService;
module.exports = exports['default'];