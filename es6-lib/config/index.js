/**
 * This service requires that a GEO_IMPORT_ENV environment variable is set.
 * It will load the configuration corresponding to the environment
 * variable value.
 *
 * If you want to load the `dev.js` configuration in top of the
 * base config, specify GEO_IMPORT_ENV=dev
 *
 */

import _ from 'underscore';
import test from './test';

var env = process.env.GEO_IMPORT_ENV;
if (!env) throw new Error('No GEO_IMPORT_ENV environment set! Please specify one.');

var baseConfig = require('./config');

function config() {
  return _.extend(baseConfig, require(`./${env}`));
}

export default config;