'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _logger = require('./logger');

var _logger2 = _interopRequireDefault(_logger);

var _heapdump2 = require('heapdump');

var _heapdump3 = _interopRequireDefault(_heapdump2);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var Metrics = (function () {
  function Metrics() {
    _classCallCheck(this, Metrics);

    setInterval(this._sampleMemory.bind(this), 1000);
  }

  _createClass(Metrics, [{
    key: '_sampleMemory',
    value: function _sampleMemory() {

      var sample = process.memoryUsage();

      if (this._last) {
        sample.rssGrowth = sample.rss / this._last.rss;
        _logger2['default'].info(sample, "metrics");
        if (sample.rssGrowth > 1.8) {
          _logger2['default'].warn("RSS Growth is very high!");
        }
      }

      this._last = sample;
    }
  }], [{
    key: 'heapdump',
    value: function heapdump(req, res) {
      req.log.info('Making a heapdump');
      _heapdump3['default'].writeSnapshot(function (err, filename) {
        if (err) return res.status(500).send(err.toString());
        req.log.info('Wrote heapdump to ' + filename);
        _fs2['default'].createReadStream(filename).pipe(res.status(200).set('content-type', 'application/octet-stream').set('content-disposition', 'inline; filename="' + filename + '"')).on('end', function () {
          return _fs2['default'].unlink(filename);
        });
      });
    }
  }]);

  return Metrics;
})();

exports['default'] = Metrics;
module.exports = exports['default'];