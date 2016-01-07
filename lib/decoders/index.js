'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _underscore = require('underscore');

var _underscore2 = _interopRequireDefault(_underscore);

var _geojson = require('./geojson');

var _geojson2 = _interopRequireDefault(_geojson);

var _kml = require('./kml');

var _kml2 = _interopRequireDefault(_kml);

var _kmz = require('./kmz');

var _kmz2 = _interopRequireDefault(_kmz);

var _shapefile = require('./shapefile');

var _shapefile2 = _interopRequireDefault(_shapefile);

function getDecoder(req, disk) {
  var ctype = req.headers['content-type'];
  var decoder = [_geojson2['default'], _kml2['default'], _kmz2['default'], _shapefile2['default']].find(function (k) {
    return _underscore2['default'].contains(k.canDecode(), ctype);
  });
  if (!decoder) return [new Error('No decoder found for ' + ctype), false];
  req.log.info('Selected decoder ' + decoder.name + ' to parse request');
  return [false, new decoder(disk)];
}

exports['default'] = getDecoder;
module.exports = exports['default'];