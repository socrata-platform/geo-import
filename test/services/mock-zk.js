'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _events = require('events');

var MockZKClient = (function (_EventEmitter) {
  _inherits(MockZKClient, _EventEmitter);

  function MockZKClient(corePort) {
    _classCallCheck(this, MockZKClient);

    _get(Object.getPrototypeOf(MockZKClient.prototype), 'constructor', this).call(this);
    if (!corePort) throw new Error('MockZKClient needs a core port');
    this._corePort = corePort;
  }

  _createClass(MockZKClient, [{
    key: 'enableErrors',
    value: function enableErrors() {
      this._broken = true;
    }
  }, {
    key: 'disableErrors',
    value: function disableErrors() {
      this._broken = false;
    }
  }, {
    key: '_err',
    value: function _err(message) {
      return {
        statusCode: 503,
        body: message
      };
    }
  }, {
    key: 'getCore',
    value: function getCore(cb) {
      if (!this._isConnected) return cb("zk not yet connected");
      if (this._broken) return cb(this._err("zk connection is dead"));
      return cb(false, 'http://localhost:' + this.corePort);
    }
  }, {
    key: 'connect',
    value: function connect() {
      setTimeout((function () {
        this._isConnected = true;
        this.emit('connected');
      }).bind(this), 20);
    }
  }, {
    key: 'corePort',
    get: function get() {
      return this._corePort;
    }
  }]);

  return MockZKClient;
})(_events.EventEmitter);

exports['default'] = MockZKClient;
module.exports = exports['default'];