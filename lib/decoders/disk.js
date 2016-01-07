'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _utilLogger = require('../util/logger');

var _utilLogger2 = _interopRequireDefault(_utilLogger);

var Disk = (function () {
  function Disk(response) {
    _classCallCheck(this, Disk);

    this._response = response;

    this._allocations = [];
    this._response.on('finish', this._cleanup.bind(this));
  }

  _createClass(Disk, [{
    key: '_cleanup',
    value: function _cleanup() {
      this._allocations.forEach(function (name) {
        var warn = function warn() {
          return _utilLogger2['default'].warn('Failed to clean up ' + name);
        };

        _fs2['default'].stat(name, function (err, stat) {
          if (err) return warn();

          if (stat.isDirectory()) {
            _utilLogger2['default'].info('Removing allocated dir ' + name);
            _fs2['default'].rmdir(name, function (err) {
              if (err) return warn();
            });
          } else {
            _utilLogger2['default'].info('Removing allocated file ' + name);
            _fs2['default'].unlink(name, function (err) {
              if (err) return warn();
            });
          }
        });
      });
    }
  }, {
    key: 'allocate',
    value: function allocate(name, opts) {
      _utilLogger2['default'].info('Allocating file ' + name);
      this._allocations.push(name);
      return _fs2['default'].createWriteStream(name, opts || {});
    }
  }]);

  return Disk;
})();

exports['default'] = Disk;
module.exports = exports['default'];