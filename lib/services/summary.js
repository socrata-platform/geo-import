'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }; })();

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _decoders = require('../decoders');

var _decoders2 = _interopRequireDefault(_decoders);

var _decodersDisk = require('../decoders/disk');

var _decodersDisk2 = _interopRequireDefault(_decodersDisk);

var _decodersMerger = require('../decoders/merger');

var _decodersMerger2 = _interopRequireDefault(_decodersMerger);

var _underscore = require('underscore');

var _underscore2 = _interopRequireDefault(_underscore);

var _utilLogger = require('../util/logger');

var _utilLogger2 = _interopRequireDefault(_utilLogger);

var _utilDevnull = require('../util/devnull');

var _utilDevnull2 = _interopRequireDefault(_utilDevnull);

var SummaryService = (function () {
  function SummaryService(config) {
    _classCallCheck(this, SummaryService);

    this._config = config;
  }

  _createClass(SummaryService, [{
    key: '_fullSummary',
    value: function _fullSummary(req) {
      //Not content length because the core http was sometimes omitting it and sometimes
      //including it? It would crash when setting it twice.
      var rSize = req.headers['x-blob-length'];
      if (!rSize) return _utilLogger2['default'].warn("X-Blob-Length omitted, going with abbreviated summary");
      return rSize < this._config.abbreviateSummarySize;
    }
  }, {
    key: 'post',
    value: function post(req, res) {
      var disk = new _decodersDisk2['default'](res);
      //;_; see the note in service/spatial for why
      //this exists
      var onErr = _underscore2['default'].once(function (err) {
        req.log.error(err.stack);
        return res.status(400).send(err.toString());
      });

      var _getDecoder = (0, _decoders2['default'])(req, disk);

      var _getDecoder2 = _slicedToArray(_getDecoder, 2);

      var err = _getDecoder2[0];
      var decoder = _getDecoder2[1];

      if (err) return res.status(400).send(err.toString());

      var ok = function ok(layers) {
        res.status(200).send(JSON.stringify({
          layers: layers
        }));
      };

      if (this._fullSummary(req) && !decoder.canSummarizeQuickly()) {
        req.log.info("Making full summary");

        req.pipe(decoder).on('error', onErr).pipe(new _decodersMerger2['default'](disk, [], true)).on('error', onErr).on('end', function (layers) {
          ok(layers.map(function (layer) {
            return layer.toJSON();
          }));
        });
      } else {
        req.log.info("Making abbreviated summary");

        req.pipe(decoder).on('data', function (_datum) {
          decoder.pause();
          decoder.summarize(function (err, summary) {
            if (err) return res.status(400).send(JSON.stringify(err));
            return ok(summary);
          });
        }).on('error', onErr).pipe(new _utilDevnull2['default']());
      }
    }
  }]);

  return SummaryService;
})();

exports['default'] = SummaryService;
module.exports = exports['default'];