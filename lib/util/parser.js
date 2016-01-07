'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _clarinet = require('clarinet');

var _clarinet2 = _interopRequireDefault(_clarinet);

var _stream = require('stream');

var _underscore = require('underscore');

var _underscore2 = _interopRequireDefault(_underscore);

var _config = require('../config');

var _config2 = _interopRequireDefault(_config);

var Parser = (function (_Transform) {
  _inherits(Parser, _Transform);

  function Parser(path) {
    _classCallCheck(this, Parser);

    _get(Object.getPrototypeOf(Parser.prototype), 'constructor', this).call(this, {
      objectMode: true,
      highWaterMark: (0, _config2['default'])().rowBufferSize
    });
    this._desiredPath = path.split('.');

    this._stack = [];
    this._state = [];

    this._underlying = _clarinet2['default'].parser();
    this._underlying.onerror = this._onerror.bind(this);
    this._underlying.onvalue = this._onvalue.bind(this);
    this._underlying.onopenobject = this._onopenobject.bind(this);
    this._underlying.onkey = this._onkey.bind(this);
    this._underlying.oncloseobject = this._oncloseobject.bind(this);
    this._underlying.onopenarray = this._onopenarray.bind(this);
    this._underlying.onclosearray = this._onclosearray.bind(this);
    this._underlying.onend = this._onend.bind(this);
  }

  _createClass(Parser, [{
    key: '_maybeEmit',
    value: function _maybeEmit(value) {
      var wasMatching = this.matching();
      var key = this._stack.pop();
      var isMatching = this.matching();
      this._stack.push(key);

      /**
       * We only emit values when we encounter a
       * value that lives on the boundary of
       * the path we are watching.
       *
       * So in this case if we are watching for "foo"
       * {"foo": {"bar": {"baz" : 1}}}
       *
       * Then close object of bar will pop bar off the stack
       * so we will still be matching, so we won't emit a value
       *
       * But the next close object (closing the `foo` object)
       * will pop `foo` so we won't be matching anymore, causing
       * a push, so {"bar": {"baz" : 1}} will be pushed
       */
      var emitValue = wasMatching && !isMatching;
      if (emitValue) this.push(value);
      return emitValue;
    }
  }, {
    key: '_onvalue',
    value: function _onvalue(value) {
      var fn = this._state.pop();
      if (fn) fn(value);
    }
  }, {
    key: '_onopenobject',
    value: function _onopenobject(firstKey) {
      var _this = this;

      var obj = {};
      this._state.push(function () {
        var fn = _this._state.pop();
        if (fn) fn(obj);
      });
      this._state.push(function (key, value) {
        obj[key] = value;
        _this._maybeEmit(value);
      });
      this._onkey(firstKey);
    }
  }, {
    key: '_onkey',
    value: function _onkey(key) {
      var _this2 = this;

      this._stack.push(key);
      var pusher;
      /**
       * If we're not matching, then the function in the state
       * that gets called when a value is encountered just
       * throws away the value and pops the key off the stack
       *
       * If we are matching, then the function in the state that
       * gets called when a value is encountered will call the
       * last setter in the state stack with the `key` and
       * the `value` encountered
       */
      if (!this.matching()) {
        pusher = function (unused) {
          var e = _this2._stack.pop(); //ignore the value because not matching
          if (e !== key) throw new Error("Invalid keys! (unused)");
        };
      } else {
        pusher = function (value) {
          // get to the obj setter because this fn has been popped
          _underscore2['default'].last(_this2._state)(key, value);
          var e = _this2._stack.pop();
          if (e !== key) throw new Error("Invalid keys!");
        };
      }
      this._state.push(pusher);
    }
  }, {
    key: '_oncloseobject',
    value: function _oncloseobject() {
      this._state.pop(); // pop the obj setter
      this._state.pop()(); // add the object to the parent
    }
  }, {
    key: '_onopenarray',
    value: function _onopenarray() {
      var _this3 = this;

      var arr = [];
      var parent;
      var pusher;

      /**
       * If we open an array in a path
       * that we aren't matching, then we
       * don't want to accumulate any elements
       * within it. They can still get emitted
       * if something within them matches, but
       * we don't want to push them into `arr`
       * because `arr` will never be used.
       * Therefore, the parent state will
       * not be emitting anything, and
       * the pusher function will not be pushing
       * anything for each item encountered in the
       * array
       */
      if (!this.matching()) {
        parent = function () {
          var fn = _this3._state.pop();
          if (fn) return fn(arr);
        };
        pusher = function (value) {
          _this3._maybeEmit(value);
          _this3._state.push(pusher);
        };
      } else {
        parent = function () {
          var fn = _this3._state.pop();
          if (fn) return fn(arr);
          _this3._maybeEmit(arr);
        };
        pusher = function (value) {
          arr.push(value);
          _this3._maybeEmit(value);
          _this3._state.push(pusher);
        };
      }

      this._state.push(parent);
      this._stack.push('*');
      this._state.push(pusher);
    }
  }, {
    key: '_onclosearray',
    value: function _onclosearray() {
      this._state.pop(); // pop the array pusher
      var e = this._stack.pop();
      if (e !== "*") throw new Error("Invalid array key");
      this._state.pop()();
    }
  }, {
    key: '_onend',
    value: function _onend() {
      this.emit('end');
    }
  }, {
    key: 'matching',
    value: function matching() {
      for (var p in this._desiredPath) {
        if (this._desiredPath[p] !== this._stack[p]) {
          return false;
        }
      }
      return true;
    }
  }, {
    key: '_onerror',
    value: function _onerror(e) {
      this.emit('error', e);
    }
  }, {
    key: '_write',
    value: function _write(chunk, encoding, cb) {
      this._underlying.write(chunk.toString());
      cb();
    }
  }, {
    key: '_flush',
    value: function _flush() {
      this._underlying.close();
    }
  }]);

  return Parser;
})(_stream.Transform);

exports['default'] = Parser;
module.exports = exports['default'];