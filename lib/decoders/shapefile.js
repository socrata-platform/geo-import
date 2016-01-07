/**
 * Convert a shapefile into SoQL Values
 *
 * NOTE: this is not pausable! pause will
 * put the stream into a paused state forever,
 * and resume will not work.
 * TODO: if this functionality is needed at some point,
 * need to revisit it.
 */
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }; })();

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _eventStream = require('event-stream');

var _eventStream2 = _interopRequireDefault(_eventStream);

var _underscore = require('underscore');

var _underscore2 = _interopRequireDefault(_underscore);

var _transform = require('./transform');

var _stream = require('stream');

var _utilBbox = require('../util/bbox');

var _utilBbox2 = _interopRequireDefault(_utilBbox);

var _shapefile = require('shapefile');

var _shapefile2 = _interopRequireDefault(_shapefile);

var _concatStream = require('concat-stream');

var _concatStream2 = _interopRequireDefault(_concatStream);

var _yauzl = require('yauzl');

var _yauzl2 = _interopRequireDefault(_yauzl);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _nodeSrs = require('node-srs');

var _nodeSrs2 = _interopRequireDefault(_nodeSrs);

var _uuid = require('uuid');

var _uuid2 = _interopRequireDefault(_uuid);

var _events = require('events');

var _async = require('async');

var _async2 = _interopRequireDefault(_async);

var _utilLogger = require('../util/logger');

var _utilLogger2 = _interopRequireDefault(_utilLogger);

var _config = require('../config');

var _config2 = _interopRequireDefault(_config);

var DEFAULT_PROJECTION = '+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs';

function isProjection(fileName) {
  return _path2['default'].extname(fileName) === '.prj';
}

function isShp(fileName) {
  return _path2['default'].extname(fileName) === '.shp';
}

/**
 * When this is created it allocates a file for writing the zip
 *
 * Flow:
 * Someone pipes zip to This, when that finishes, emit 'finish' event
 * on 'finish' event, extract zip from fs
 * for each top level file in the zip, open a read stream and write
 *   to disk following shp naming convention - this step can be
 *   eliminated using the underlying shp library!
 * group the read streams into [.shp, .prj] tuples
 * for each of those, load the prj
 */

var Shapefile = (function (_Duplex) {
  _inherits(Shapefile, _Duplex);

  function Shapefile(disk) {
    _classCallCheck(this, Shapefile);

    _get(Object.getPrototypeOf(Shapefile.prototype), 'constructor', this).call(this, {
      objectMode: true,
      highWaterMark: (0, _config2['default'])().rowBufferSize
    });

    //going to need this for creating the subfiles
    this._disk = disk;

    this._fgroup = _uuid2['default'].v4();
    this._zName = this._fileGroup('.zip');
    //space on disk for us to buffer the entire zip archive
    //before extraction
    this._zBuffer = this._disk.allocate(this._zName, {
      defaultEncoding: 'binary'
    });

    //when the stream piped into this stream is finished,
    //finish will be emitted, and this stream will become readable
    this.on('finish', this._onFinished.bind(this));
    this._zBuffer.on('finish', this._onBuffered.bind(this));
  }

  _createClass(Shapefile, [{
    key: '_fileGroup',
    value: function _fileGroup(extension, name) {
      name = name || 'shapefile';
      return '/tmp/' + name + '_' + this._fgroup + extension;
    }
  }, {
    key: '_write',
    value: function _write(chunk, encoding, done) {
      return this._zBuffer.write(chunk, encoding, done);
    }
  }, {
    key: '_onFinished',
    value: function _onFinished() {
      _utilLogger2['default'].debug('Finished reading stream, closing underlying shapefile buffer');
      this._zBuffer.end();
    }
  }, {
    key: '_onRecord',
    value: function _onRecord(record, projection, readNext) {
      //;_:
      //hack because https://github.com/mbostock/shapefile/blob/b4470c9a3d121bd201ca0b458d1e97b0a4d3547f/index.js#L173
      //which turns things in to Multipolygons if they have rings ಠ_ಠ
      if (record.geometry.type === 'Polygon') {
        record.geometry.type = 'MultiPolygon';
        record.geometry.coordinates = [record.geometry.coordinates];
      }

      if (!this.push((0, _transform.geoJsToSoQL)(record, projection))) {
        this._readableState.pipes.once('drain', readNext);
      } else {
        readNext();
      }
    }
  }, {
    key: '_emitFeatures',
    value: function _emitFeatures(emitter, reader, projection) {
      var _this = this;

      var readNext = function readNext() {
        reader.readRecord(function (err, record) {
          if (err) return emitter.emit('error', new Error('Failed to read feature ' + err));
          if (record === _shapefile2['default'].end) return emitter.emit('end');
          return emitter.emit('record', record);
        });
      };

      emitter.on('record', function (record) {
        _this._onRecord(record, projection, readNext);
      });

      reader.readHeader(function (err, header) {
        if (err) return emitter.emit('error', new Error('Failed to read shapefile header ' + err));
        readNext();
      });
    }
  }, {
    key: '_shapeStream',
    value: function _shapeStream(reader, proj) {
      var _this2 = this;

      //the reader is closed automatically if an error occurrs
      var emitter = new _events.EventEmitter();

      _fs2['default'].stat(proj || '', function (err, status) {
        if (err && err.code === 'ENOENT') {
          _utilLogger2['default'].warn("Shapefile is missing a projection, going with the default");
          return _this2._emitFeatures(emitter, reader, DEFAULT_PROJECTION);
        }

        _fs2['default'].readFile(proj, function (projError, projection) {
          if (projError) return emitter.emit('error', projError);
          projection = projection.toString('utf-8');

          return _this2._emitFeatures(emitter, reader, projection);
        });
      });
      return emitter;
    }
  }, {
    key: '_groupComponents',
    value: function _groupComponents(components) {
      components.sort();
      var shps = components.filter(function (c) {
        return isShp(c);
      });
      var projs = components.filter(function (c) {
        return isProjection(c);
      });
      return _underscore2['default'].zip(shps, projs);
    }
  }, {
    key: '_startPushing',
    value: function _startPushing() {
      var _this3 = this;

      this._isPushing = true;

      var groups = this._groupComponents(this._components);
      _async2['default'].mapSeries(groups, function (_ref, cb) {
        var _ref2 = _slicedToArray(_ref, 2);

        var shp = _ref2[0];
        var proj = _ref2[1];

        _this3._shapeStream(_shapefile2['default'].reader(shp), proj).on('error', function (err) {
          return cb(err);
        }).on('end', function () {
          return cb(false, false);
        });
      }, function (err) {
        if (err) return _this3.emit('error', err);
        _this3.push(null);
      });
    }
  }, {
    key: '_walk',
    value: function _walk(onErr, onFile, onClose) {
      _utilLogger2['default'].debug("Shapefile buffered to disk");
      var extracted = [];
      _yauzl2['default'].open(this._zName, function (err, zipFile) {
        if (err) return onErr(err);
        zipFile.on('entry', function (entry) {
          //We only want top level shape files
          if (_path2['default'].dirname(entry.fileName).split(_path2['default'].sep).length !== 1) return;
          onFile(entry, zipFile);
        })
        //this is a terrible hack. close gets called when the stream is closed, not when
        //it is flushed. fix would be to fork the yauzl library and make it emit close
        //when all readstreams that are opened with openReadStream emit 'finish'
        .on('close', function () {
          return setTimeout(onClose, 50);
        }).on('error', onErr);
      });
    }

    /**
     * TODO: This has an extra copy, could be sped up probably
     */
  }, {
    key: '_onBuffered',
    value: function _onBuffered() {
      var _this4 = this;

      var extracted = [];
      this._walk(function (err) {
        _this4.emit('error', err);
      }, function (entry, zipFile) {
        zipFile.openReadStream(entry, function (err, fstream) {
          if (err) return _this4.emit('error', err);

          var ext = _path2['default'].extname(entry.fileName);
          var basename = _path2['default'].basename(entry.fileName, ext);
          var extractedName = _this4._fileGroup(ext, basename);
          var writeStream = _this4._disk.allocate(extractedName, {
            defaultEncoding: 'binary'
          });
          extracted.push(extractedName);
          return fstream.pipe(writeStream);
        });
      }, function () {
        _this4._components = extracted;
        _this4.emit('readable');
      });
    }
  }, {
    key: 'summarize',
    value: function summarize(cb) {
      var _this5 = this;

      var extracted = [];
      this._walk(function (err) {
        cb(err);
      }, function (entry, zipFile) {
        if (isProjection(entry.fileName)) {
          zipFile.openReadStream(entry, function (err, fstream) {
            if (err) return _this5.emit('error', err);
            return fstream.pipe((0, _concatStream2['default'])(function (projection) {
              extracted.push([entry.fileName, projection.toString('utf-8')]);
            }));
          });
        }
      }, function () {
        cb(false, extracted.map(function (_ref3) {
          var _ref32 = _slicedToArray(_ref3, 2);

          var filename = _ref32[0];
          var projection = _ref32[1];

          var proj = _nodeSrs2['default'].parse(projection);
          return {
            count: 0,
            projection: proj.name,
            name: _path2['default'].basename(filename, '.prj'),
            geometry: null,
            bbox: new _utilBbox2['default']().toJSON(),
            columns: []
          };
        }));
      });
    }
  }, {
    key: 'canSummarizeQuickly',
    value: function canSummarizeQuickly() {
      return true;
    }
  }, {
    key: '_read',
    value: function _read() {
      if (!this._readableState.emittedReadable && !this._isPushing) {
        this.once('readable', this._startPushing.bind(this));
      } else if (!this._isPushing) {
        this._startPushing();
      }
    }
  }], [{
    key: 'canDecode',
    value: function canDecode() {
      return ['application/zip', 'application/octet-stream'];
    }
  }]);

  return Shapefile;
})(_stream.Duplex);

exports['default'] = Shapefile;
module.exports = exports['default'];