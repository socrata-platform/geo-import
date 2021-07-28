/**
 * This service requires that a GEO_IMPORT_ENV environment variable is set.
 * It will load the configuration corresponding to the environment
 * variable value.
 *
 * If you want to load the `dev` configuration in top of the
 * base config, specify GEO_IMPORT_ENV=dev
 *
 */

import _ from 'underscore';
import test from './test';
import merge from 'deepmerge';
import baseConfig from './config';

var env = process.env.GEO_IMPORT_ENV;
if (!env) throw new Error('No GEO_IMPORT_ENV environment set! Please specify one.');

const conf = merge(baseConfig, require(`./${env}`));

function config() {
  return conf;
}

export default config;
