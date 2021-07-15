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
import test from './test.js';
import merge from 'deepmerge';
import baseConfig from './config.js';
import devEnv from './dev.js';
import prodEnv from './prod.js';
import testEnv from './test.js';

var env = process.env.GEO_IMPORT_ENV;
if (!env) throw new Error('No GEO_IMPORT_ENV environment set! Please specify one.');

let conf;
if (env === 'prod') {
	conf = merge(baseConfig, prodEnv);
} else if (env === 'test') {
	conf = merge(baseConfig, testEnv);
} else {
	conf = merge(baseConfig, devEnv);
}

function config() {
  return conf;
}

export default config;
