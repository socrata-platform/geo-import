"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; })();

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var MIN_LONGITUDE = -180;
var MAX_LONGITUDE = 180;
var MIN_LATITUDE = -90;
var MAX_LATITUDE = 90;

var BBox = (function () {
  function BBox() {
    _classCallCheck(this, BBox);

    this._coords = {
      minx: Infinity,
      miny: Infinity,
      maxx: -Infinity,
      maxy: -Infinity
    };
  }

  _createClass(BBox, [{
    key: "toJSON",
    value: function toJSON() {
      return this._coords;
    }
  }, {
    key: "_isValid",
    value: function _isValid(_ref) {
      var _ref2 = _slicedToArray(_ref, 2);

      var x = _ref2[0];
      var y = _ref2[1];

      var validMinX = x >= MIN_LONGITUDE;
      var validMaxX = x <= MAX_LONGITUDE;

      var validMinY = y >= MIN_LATITUDE;
      var validMaxY = y <= MAX_LATITUDE;
      return validMinX && validMinY && validMinY && validMaxY;
    }
  }, {
    key: "merge",
    value: function merge(bbox) {
      this._coords.minx = Math.min(bbox.minx, this._coords.minx);
      this._coords.miny = Math.min(bbox.miny, this._coords.miny);

      this._coords.maxx = Math.max(bbox.maxx, this._coords.maxx);
      this._coords.maxy = Math.max(bbox.maxy, this._coords.maxy);

      return this;
    }
  }, {
    key: "expand",
    value: function expand(coord) {
      if (!this._isValid(coord)) return this;

      var _coord = _slicedToArray(coord, 2);

      var x = _coord[0];
      var y = _coord[1];

      this._coords.minx = Math.min(x, this._coords.minx);
      this._coords.miny = Math.min(y, this._coords.miny);

      this._coords.maxx = Math.max(x, this._coords.maxx);
      this._coords.maxy = Math.max(y, this._coords.maxy);

      return this;
    }
  }, {
    key: "maxx",
    get: function get() {
      return this._coords.maxx;
    }
  }, {
    key: "maxy",
    get: function get() {
      return this._coords.maxy;
    }
  }, {
    key: "minx",
    get: function get() {
      return this._coords.minx;
    }
  }, {
    key: "miny",
    get: function get() {
      return this._coords.miny;
    }
  }]);

  return BBox;
})();

exports["default"] = BBox;
module.exports = exports["default"];