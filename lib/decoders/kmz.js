'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _yauzl = require('yauzl');

var _yauzl2 = _interopRequireDefault(_yauzl);

var _kml = require('./kml');

var _kml2 = _interopRequireDefault(_kml);

var _through = require('through');

var _through2 = _interopRequireDefault(_through);

var _uuid = require('uuid');

var _uuid2 = _interopRequireDefault(_uuid);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _eventStream = require('event-stream');

var _eventStream2 = _interopRequireDefault(_eventStream);

var _stream = require('stream');

var _utilLogger = require('../util/logger');

var _utilLogger2 = _interopRequireDefault(_utilLogger);

var _config = require('../config');

var _config2 = _interopRequireDefault(_config);

/**
 * ZIP archives are dumb in that their directory structure
 * is stored in a footer, so we have to unzip it onto disk
 * and then pipe it through the KML transform UGH
 */

var KMZ = (function (_Duplex) {
  _inherits(KMZ, _Duplex);

  function KMZ(disk) {
    _classCallCheck(this, KMZ);

    _get(Object.getPrototypeOf(KMZ.prototype), 'constructor', this).call(this, {
      objectMode: true,
      highWaterMark: (0, _config2['default'])().rowBufferSize
    });

    this._zName = '/tmp/kmz_' + _uuid2['default'].v4() + '.zip';
    this._zBuffer = disk.allocate(this._zName, {
      defaultEncoding: 'binary'
    });

    this.on('finish', this._onFinished.bind(this));
    this._zBuffer.on('finish', this._onBuffered.bind(this));
    this._kmlDecoder = new _kml2['default']();
  }

  _createClass(KMZ, [{
    key: '_write',
    value: function _write(chunk, encoding, done) {
      return this._zBuffer.write(chunk, null, done);
    }
  }, {
    key: '_onFinished',
    value: function _onFinished() {
      _utilLogger2['default'].debug('Finished reading stream, closing underlying kmz buffer');
      this._zBuffer.end();
    }
  }, {
    key: '_onBuffered',
    value: function _onBuffered() {
      this.emit('readable');
    }
  }, {
    key: '_onOpenKmlStream',
    value: function _onOpenKmlStream(kmlStream, zipFile) {
      var _this = this;

      kmlStream.pipe(this._kmlDecoder).on('error', function (err) {
        _this.emit('error', err);
      }).on('data', function (data) {
        if (!_this.push(data)) {
          kmlStream.pause();
          _this._readableState.pipes.once('drain', function () {
            kmlStream.resume();
          });
        }
      }).on('end', function () {
        if (zipFile.entriesRead === zipFile.entryCount) {
          _this.push(null);
        }
      });
    }
  }, {
    key: '_startPushing',
    value: function _startPushing() {
      var _this2 = this;

      this._isPushing = true;
      _yauzl2['default'].open(this._zName, function (err, zipFile) {
        if (err) return _this2.emit('error', err);
        zipFile.on('error', function (err) {
          _this2.emit('error', err);
        }).on('entry', function (entry) {
          if (_path2['default'].extname(entry.fileName) !== '.kml') return;

          zipFile.openReadStream(entry, function (err, kmlStream) {
            if (err) return _this2.emit('error', err);
            _utilLogger2['default'].info('Extracting kml ' + entry.fileName + ' from kmz archive');
            _this2._onOpenKmlStream(kmlStream, zipFile);
          });
        });
      });
    }

    //just cuz
  }, {
    key: '_read',
    value: function _read() {
      if (!this._readableState.emittedReadable && !this._isPushing) {
        this.once('readable', this._startPushing.bind(this));
      } else if (!this._isPushing) {
        this._startPushing();
      }
    }
  }, {
    key: 'summarize',
    value: function summarize(cb) {
      return this._kmlDecoder.summarize(cb);
    }
  }, {
    key: 'canSummarizeQuickly',
    value: function canSummarizeQuickly() {
      return false;
    }
  }], [{
    key: 'canDecode',
    value: function canDecode() {
      return ['application/vnd.google-earth.kmz'];
    }
  }]);

  return KMZ;
})(_stream.Duplex);

exports['default'] = KMZ;
module.exports = exports['default'];