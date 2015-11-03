import _ from 'underscore';
import test from './test'

var env = process.env.GEO_IMPORT_ENV;
if (!env) throw new Error('No GEO_IMPORT_ENV environment set! Please specify one.');

var baseConfig = require('./config');

console.log(`Loading configuration at config/${env}.js`);

function config() {
  return _.extend(baseConfig, require(`./${env}`))
};

export default config;