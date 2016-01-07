'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
var pack = require('../../package.json');

var VersionService = {
  'get': function get(req, res) {
    res.status(200).send({
      'name': pack.name,
      'version': pack.version
    });
  }
};

exports['default'] = VersionService;
module.exports = exports['default'];