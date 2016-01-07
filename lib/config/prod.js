'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
var zkEnsemble;
var envZk = process.env.ZOOKEEPER_ENSEMBLE;
try {
  zkEnsemble = JSON.parse(envZk);
} catch (e) {
  throw new Error('Failed to parse ZOOKEEPER_ENSEMBLE environment variable ' + envZk);
}

if (!zkEnsemble) throw new Error('Invalid ZOOKEEPER_ENSEMBLE environment variable ' + envZk);

exports['default'] = {
  zk: zkEnsemble,

  log: {
    level: 'debug',
    name: 'geo-import'
  }
};
module.exports = exports['default'];