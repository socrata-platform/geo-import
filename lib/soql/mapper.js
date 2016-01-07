'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _underscore = require('underscore');

var _underscore2 = _interopRequireDefault(_underscore);

var soqls = [require('./point'), require('./line'), require('./polygon'), require('./multipoint'), require('./multiline'), require('./multipolygon'), require('./text'), require('./boolean'), require('./number'), require('./array'), require('./null'), require('./date')];

var types = _underscore2['default'].object(soqls.map(function (soql) {
  return [soql.ctype(), soql];
}));

exports.types = types;