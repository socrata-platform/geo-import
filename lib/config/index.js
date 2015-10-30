import _ from 'underscore';
import test from './test'

var env = process.env.GEO_IMPORT_ENV;
if (!env) throw new Error('No GEO_IMPORT_ENV environment set! Please specify one.');

var baseConfig = require('./config');

var configs = {
  'test': test
}

console.log(`Loading config/${env}.js`);

function config() {
  return _.extend(baseConfig, configs[env])
};

export default config;