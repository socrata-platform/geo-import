'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _underscore = require('underscore');

var _underscore2 = _interopRequireDefault(_underscore);

var _changeCase = require('change-case');

var _changeCase2 = _interopRequireDefault(_changeCase);

var SoQL = (function () {
  function SoQL(name, value) {
    _classCallCheck(this, SoQL);

    this.rawName = name;
    this.name = this._launderName(name);
    this.value = value;
  }

  /**
   * This is all the old geo importer did.
   * TODO: this is necessary, but is this sufficient?
   */

  _createClass(SoQL, [{
    key: '_launderName',
    value: function _launderName(name) {
      name = _changeCase2['default'].snakeCase(name);
      if (!_underscore2['default'].isNaN(parseInt(name[0]))) {
        name = '_' + name;
      }
      return name;
    }

    /**
      Type name that core maps onto a SoQLType
    */
  }, {
    key: 'toJSON',
    value: function toJSON() {
      return {
        fieldName: this.name,
        name: this.rawName,
        dataTypeName: this.dataTypeName
      };
    }
  }, {
    key: 'dataTypeName',
    get: function get() {
      return this.constructor.name.slice(4).toLowerCase();
    }

    /**
      Javascript type that this SoQLType maps to
    */
  }, {
    key: 'ctype',
    get: function get() {
      return this.constructor.ctype();
    }
  }, {
    key: 'isGeometry',
    get: function get() {
      return false;
    }
  }]);

  return SoQL;
})();

exports['default'] = SoQL;
module.exports = exports['default'];