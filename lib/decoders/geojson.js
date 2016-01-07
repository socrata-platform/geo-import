/**
 * Convert a stream of geojson into a stream
 * of SoQLValues.
 *
 * TODO: hierarchical CRS via geometry collections (;_;)
 */
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _eventStream = require('event-stream');

var _eventStream2 = _interopRequireDefault(_eventStream);

var _underscore = require('underscore');

var _underscore2 = _interopRequireDefault(_underscore);

var _transform2 = require('./transform');

var _soqlMapper = require('../soql/mapper');

var _stream = require('stream');

var _utilParser = require('../util/parser');

var _utilParser2 = _interopRequireDefault(_utilParser);

var _config = require('../config');

var _config2 = _interopRequireDefault(_config);

var GeoJSON = (function (_Transform) {
  _inherits(GeoJSON, _Transform);

  function GeoJSON() {
    _classCallCheck(this, GeoJSON);

    _get(Object.getPrototypeOf(GeoJSON.prototype), 'constructor', this).call(this, {
      objectMode: true,
      highWaterMark: (0, _config2['default'])().rowBufferSize
    });

    var err = this._onError.bind(this);

    this._featureParser = new _utilParser2['default']('features.*').on('error', err).on('data', this._onFeature.bind(this));
    this._crsParser = new _utilParser2['default']('crs.properties.name').on('error', err).on('data', this._onCrs.bind(this));
  }

  _createClass(GeoJSON, [{
    key: '_onError',
    value: function _onError(err) {
      this.emit('error', err);
    }
  }, {
    key: '_onFeature',
    value: function _onFeature(feature) {
      var soqlFeature = (0, _transform2.geoJsToSoQL)(feature);
      if (soqlFeature) this.push(soqlFeature);
    }
  }, {
    key: '_onCrs',
    value: function _onCrs(crs) {
      return this.push({
        defaultCrs: crs
      });
    }
  }, {
    key: '_transform',
    value: function _transform(chunk, encoding, done) {
      this._crsParser.write(chunk);
      this._featureParser.write(chunk);
      done();
    }
  }, {
    key: 'summarize',
    value: function summarize(cb) {
      return cb(false, []);
    }
  }, {
    key: 'canSummarizeQuickly',
    value: function canSummarizeQuickly() {
      return false;
    }
  }], [{
    key: 'canDecode',
    value: function canDecode() {
      return ['application/json'];
    }
  }]);

  return GeoJSON;
})(_stream.Transform);

exports['default'] = GeoJSON;
module.exports = exports['default'];