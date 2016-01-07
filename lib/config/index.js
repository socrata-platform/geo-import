/**
 * This service requires that a GEO_IMPORT_ENV environment variable is set.
 * It will load the configuration corresponding to the environment
 * variable value.
 *
 * If you want to load the `dev.js` configuration in top of the
 * base config, specify GEO_IMPORT_ENV=dev
 *
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _underscore = require('underscore');

var _underscore2 = _interopRequireDefault(_underscore);

var _test = require('./test');

var _test2 = _interopRequireDefault(_test);

var env = process.env.GEO_IMPORT_ENV;
if (!env) throw new Error('No GEO_IMPORT_ENV environment set! Please specify one.');

var baseConfig = require('./config');

function config() {
  return _underscore2['default'].extend(baseConfig, require('./' + env));
}

exports['default'] = config;
module.exports = exports['default'];