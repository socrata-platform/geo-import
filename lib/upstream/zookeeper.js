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

var _nodeZookeeperClient = require('node-zookeeper-client');

var _nodeZookeeperClient2 = _interopRequireDefault(_nodeZookeeperClient);

var _underscore = require('underscore');

var _underscore2 = _interopRequireDefault(_underscore);

var _util = require('util');

var _util2 = _interopRequireDefault(_util);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _events = require('events');

var _utilLogger = require('../util/logger');

var _utilLogger2 = _interopRequireDefault(_utilLogger);

var CORE_PATH = '/com.socrata/soda/services/core';

var Zookeeper = (function (_EventEmitter) {
  _inherits(Zookeeper, _EventEmitter);

  function Zookeeper(conf) {
    _classCallCheck(this, Zookeeper);

    _get(Object.getPrototypeOf(Zookeeper.prototype), 'constructor', this).call(this);
    this._conf = conf;
    if (!this._conf) throw new Error('Zookeeper argument error!');
    this._init();
  }

  _createClass(Zookeeper, [{
    key: '_init',
    value: function _init() {
      var _this = this;

      _utilLogger2['default'].info('Initializing zookeeper client');
      if (this._client) this._client.close();

      var _conf$zk = _slicedToArray(this._conf.zk, 1);

      var aZookeeperNode = _conf$zk[0];

      this._client = _nodeZookeeperClient2['default'].createClient(aZookeeperNode);

      //proxy the underlying events onto this emitter
      var events = ['connected', 'connectedReadOnly', 'disconnected', 'expired', 'authenticationFailed'];
      events.forEach(function (ev) {
        _this._client.on(ev, _underscore2['default'].partial(_this.emit, ev).bind(_this));
        _this.on(ev, _underscore2['default'].partial(_this._logEvent, ev).bind(_this));
      });

      this._client.on('expired', this._onExpired.bind(this));
    }
  }, {
    key: '_logEvent',
    value: function _logEvent(ev) {
      _utilLogger2['default'].info('zookeeper client event: ' + ev);
    }
  }, {
    key: '_onExpired',
    value: function _onExpired() {
      _utilLogger2['default'].warn('Zookeeper disconnected! Retrying...');
      this._init();
      this.connect();
    }
  }, {
    key: '_getCore',
    value: function _getCore(cb) {
      var _this2 = this;

      this._client.getChildren(CORE_PATH, function (err, children) {
        if (err) return cb(err);
        if (!children.length) return cb({
          statusCode: 502,
          body: 'No core nodes registered in zookeeper'
        });
        var chosen = children[Math.floor(Math.random() * children.length)];
        var instance = _path2['default'].join(CORE_PATH, chosen);
        _this2._client.getData(instance, function (err, buf) {
          if (err) return cb(err);
          try {
            var entry = JSON.parse(buf.toString('utf-8'));
            //scheme isn't in the zk entry? what happens if we go ssl ¯\_(ツ)_/¯
            var scheme = 'http';
            var url = scheme + '://' + entry.address + ':' + entry.port;
            _utilLogger2['default'].debug('Core lives at ' + url);
            return cb(false, url);
          } catch (err) {
            return cb(err);
          }
        });
      });
    }
  }, {
    key: 'getCore',
    value: function getCore(cb) {
      var _this3 = this;

      _utilLogger2['default'].debug('Attempt to get core client');
      if (this._client.getState() === _nodeZookeeperClient2['default'].State.SYNC_CONNECTED) {
        return this._getCore(cb);
      } else {
        _utilLogger2['default'].warn('State is currently ' + this._client.getState() + ', waiting for reconnect');
        this._client.once('connected', function () {
          _this3._getCore(cb);
        });
      }
    }
  }, {
    key: 'connect',
    value: function connect() {
      this._client.connect();
      return this;
    }
  }]);

  return Zookeeper;
})(_events.EventEmitter);

exports['default'] = Zookeeper;
module.exports = exports['default'];