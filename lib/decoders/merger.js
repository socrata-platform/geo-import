/**
 * Convert a stream of soql rows into a list of layers
 *
 * A new layer is created when a feature whos schema doesn't match any
 * existing layers is encountered. A feature belongs in a layer if it
 * has the same columns (name and type) as the layer
 *
 * Each layer opens a write stream on creation in a temporary location
 * and writes each feature to disk so things are not buffered
 * in memory.
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _underscore = require('underscore');

var _underscore2 = _interopRequireDefault(_underscore);

var _layer = require('./layer');

var _layer2 = _interopRequireDefault(_layer);

var _eventStream = require('event-stream');

var es = _interopRequireWildcard(_eventStream);

var _soqlMapper = require('../soql/mapper');

var _stream = require('stream');

var _disk = require('./disk');

var _disk2 = _interopRequireDefault(_disk);

var _utilLogger = require('../util/logger');

var _utilLogger2 = _interopRequireDefault(_utilLogger);

var _async = require('async');

var _async2 = _interopRequireDefault(_async);

var _config = require('../config');

var _config2 = _interopRequireDefault(_config);

var DEFAULT_CRS = "urn:ogc:def:crs:OGC:1.3:CRS84";

var Merger = (function (_Transform) {
  _inherits(Merger, _Transform);

  function Merger(disk, specs, throwaway) {
    _classCallCheck(this, Merger);

    _get(Object.getPrototypeOf(Merger.prototype), 'constructor', this).call(this, {
      objectMode: true,
      highWaterMark: (0, _config2['default'])().rowBufferSize
    });
    if (!disk) throw new Error("Merger needs a disk");
    this._specs = specs || [];
    this._throwaway = throwaway;
    this._disk = disk;
    this._layers = [];
    this._defaultCrs = DEFAULT_CRS;

    this.once('finish', this._onFinish);
  }

  _createClass(Merger, [{
    key: '_getOrCreateLayer',
    value: function _getOrCreateLayer(soqlRow, disk, spec) {
      var columns = soqlRow.columns;
      var layer = this._layers.find(function (layer) {
        return layer.belongsIn(columns);
      });
      if (!layer) {
        layer = new _layer2['default'](columns.map(function (soqlValue) {
          var t = _soqlMapper.types[soqlValue.ctype];
          if (!t) {
            _utilLogger2['default'].warn('No SoQLType found for ' + soqlValue.ctype + ', falling back to SoQLText');
            t = _soqlMapper.types.string;
          }
          return new t(soqlValue.rawName);
        }), this._layers.length, disk, spec);
        this._layers.push(layer);
      }
      return layer;
    }
  }, {
    key: '_transform',
    value: function _transform(chunk, encoding, done) {
      if (chunk && chunk.defaultCrs) {
        this._defaultCrs = chunk.defaultCrs;
        return done();
      }
      var spec = this._specs[this._layers.length];
      var layer = this._getOrCreateLayer(chunk, this._disk, spec);
      layer.write(chunk.crs, chunk.columns, this._throwaway, done);
    }
  }, {
    key: '_onFinish',
    value: function _onFinish() {
      var _this = this;

      this._layers.forEach(function (layer) {
        layer.defaultCrs = _this._defaultCrs;
      });
      _async2['default'].each(this._layers, function (l, cb) {
        return l.close(cb);
      }, function (err) {
        if (err) return _this.emit('error', err);
        _this.emit('end', _this.layers);
      });
    }
  }, {
    key: 'layers',
    get: function get() {
      return this._layers;
    }
  }]);

  return Merger;
})(_stream.Transform);

exports['default'] = Merger;
module.exports = exports['default'];