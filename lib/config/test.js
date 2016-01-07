'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports['default'] = {
  port: 6665,

  //abbreviate summaries at 50kb
  abbreviateSummarySize: 50 * 1000,

  zk: ["localhost:2181"],
  log: {
    level: 'critical',
    name: 'geo-import'
  }
};
module.exports = exports['default'];