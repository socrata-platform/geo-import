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

var _proj4 = require('proj4');

var _proj42 = _interopRequireDefault(_proj4);

var _soql = require('./soql');

var _soql2 = _interopRequireDefault(_soql);

var _nodeSrs = require('node-srs');

var srs = _interopRequireWildcard(_nodeSrs);

var SoQLGeom = (function (_SoQL) {
  _inherits(SoQLGeom, _SoQL);

  function SoQLGeom() {
    _classCallCheck(this, SoQLGeom);

    _get(Object.getPrototypeOf(SoQLGeom.prototype), 'constructor', this).apply(this, arguments);
  }

  _createClass(SoQLGeom, [{
    key: 'reproject',
    value: function reproject(from, to) {
      if (from.input !== to.input) {
        this._value = this.mapCoordinates(function (coord) {
          return (0, _proj42['default'])(from.proj4, to.proj4, coord);
        });
        return this;
      }
      return this;
    }
  }, {
    key: 'mapCoordinates',
    value: function mapCoordinates(fn) {
      throw new Error("Not implemented!");
    }
  }, {
    key: 'isGeometry',
    get: function get() {
      return true;
    }
  }, {
    key: 'value',
    set: function set(v) {
      if (!v) return;
      if (!v.coordinates) throw new Error("Geometry needs coordinates");
      this._value = v.coordinates;
    },
    get: function get() {
      var n = this.ctype;
      return {
        'type': this._type,
        coordinates: this._value
      };
    }
  }]);

  return SoQLGeom;
})(_soql2['default']);

exports['default'] = SoQLGeom;
module.exports = exports['default'];