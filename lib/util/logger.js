'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _underscore = require('underscore');

var _underscore2 = _interopRequireDefault(_underscore);

var _bunyan = require('bunyan');

var _bunyan2 = _interopRequireDefault(_bunyan);

var _config = require('../config');

var _config2 = _interopRequireDefault(_config);

var _uuid = require('uuid');

var _uuid2 = _interopRequireDefault(_uuid);

var logger = false;

var LogWrapper = (function () {
  function LogWrapper() {
    _classCallCheck(this, LogWrapper);
  }

  _createClass(LogWrapper, [{
    key: '_proxy',
    value: function _proxy() {
      var _this = this;

      ['debug', 'info', 'warn', 'error', 'critical'].forEach(function (level) {
        _this[level] = function (metadata, message) {
          if (_underscore2['default'].isObject(metadata)) {
            metadata = _underscore2['default'].extend({}, metadata, _this._meta());
            _this._log[level](metadata, message);
          } else {
            _this._log[level](_this._meta(), metadata);
          }
        };
      });
    }
  }, {
    key: '_meta',
    value: function _meta() {
      return {};
    }
  }]);

  return LogWrapper;
})();

var RequestLogger = (function (_LogWrapper) {
  _inherits(RequestLogger, _LogWrapper);

  function RequestLogger(req, res, log) {
    _classCallCheck(this, RequestLogger);

    _get(Object.getPrototypeOf(RequestLogger.prototype), 'constructor', this).call(this);
    this._log = log;
    this._req = req;
    this._res = res;
    this._id = this._getOrGenReqId(req);
    this._proxy();
  }

  _createClass(RequestLogger, [{
    key: '_getOrGenReqId',
    value: function _getOrGenReqId(req) {
      return req.headers['x-socrata-requestid'] || _uuid2['default'].v4().slice(0, 8);
    }
  }, {
    key: '_meta',
    value: function _meta() {
      return {
        'request_id': this._id
      };
    }
  }]);

  return RequestLogger;
})(LogWrapper);

var Logger = (function (_LogWrapper2) {
  _inherits(Logger, _LogWrapper2);

  function Logger() {
    _classCallCheck(this, Logger);

    _get(Object.getPrototypeOf(Logger.prototype), 'constructor', this).call(this);
    var conf = (0, _config2['default'])();
    if (!conf.log) throw new Error("Attempted to create logger without a log configuration!");
    this._log = _bunyan2['default'].createLogger(conf.log);
    this._proxy();
  }

  //;_; ;_; ;_; ;_; this is weird

  _createClass(Logger, [{
    key: '_bindRequest',
    value: function _bindRequest(req, res, next) {
      req.log = res.log = new RequestLogger(req, res, this._log);
      req.log.info('Request to ' + req.url + ' with ' + req.headers['content-type']);
      res.on('finish', function () {
        req.log.info('Request finished with ' + res.statusCode);
      });

      var s = res.send.bind(res);
      res.send = function (payload) {
        if (res.statusCode >= 400) {
          res.log.warn(payload);
        }
        return s(payload);
      };

      next();
    }
  }, {
    key: 'request',
    value: function request() {
      return this._bindRequest.bind(this);
    }
  }]);

  return Logger;
})(LogWrapper);

if (!logger) logger = new Logger();

exports['default'] = logger;
module.exports = exports['default'];