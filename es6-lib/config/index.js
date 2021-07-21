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
import merge from 'deepmerge';
import baseConfig from './config.js';
import dev from './dev.js';
import prod from './prod.js';
import test from './test.js';

var env = process.env.GEO_IMPORT_ENV;
if (!env) throw new Error('No GEO_IMPORT_ENV environment set! Please specify one.');

let conf;
if (env === 'prod') {
	conf = merge(baseConfig, prod());
} else if (env === 'test') {
	conf = merge(baseConfig, test());
} else {
	conf = merge(baseConfig, dev());
}

function config() {
  return conf;
}

export default config;
