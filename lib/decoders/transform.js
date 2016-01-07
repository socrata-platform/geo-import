'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _soqlMapper = require('../soql/mapper');

var _underscore = require('underscore');

var _underscore2 = _interopRequireDefault(_underscore);

var _soqlNull = require('../soql/null');

var _soqlNull2 = _interopRequireDefault(_soqlNull);

var _utilLogger = require('../util/logger');

var _utilLogger2 = _interopRequireDefault(_utilLogger);

/**
  Turn the feature into a SoQLType. If no mapping exists, it will get filtered
  out of the pipe
*/
function geoJsToSoQL(feature, crs) {
  if (!feature.type || feature.type.toLowerCase() !== 'feature') {
    _utilLogger2['default'].warn('Invalid feature props, omitting: ' + feature);
    return false;
  }

  if (!feature.geometry) {
    _utilLogger2['default'].warn('Invalid feature geometry, omitting: ' + feature);
    return false;
  }

  if (feature.crs && !crs) {
    if (feature.crs.href) {
      _utilLogger2['default'].warn('No support for linked CRS yet. Omitting feature: ' + featre);
      return false;
    }
    crs = feature.crs.properties.name;
  }
  return toRow(feature.geometry, geomToSoQL, feature.properties, propToSoQL, crs);
}

function soqlTypeFor(value) {
  if (_underscore2['default'].isDate(value)) return _soqlMapper.types.date;
  if (_underscore2['default'].isArray(value)) return _soqlMapper.types.array;
  if (_underscore2['default'].isNull(value)) return _soqlNull2['default'];
  return _soqlMapper.types[typeof value];
}

function propToSoQL(name, value) {
  var t = soqlTypeFor(value);
  if (!t) {
    _utilLogger2['default'].warn('Invalid property ' + name + ' type: ' + typeof value + ' ' + value);
    return false;
  }
  return new t(name, value);
}

function geomToSoQL(geom) {
  if (geom === null) return new _soqlNull2['default']('the_geom');
  var ctype = geom.type.toLowerCase();
  var t = _soqlMapper.types[ctype];
  if (!t) {
    _utilLogger2['default'].warn('Invalid geom property, ' + typeof value + ' ' + value);
    return false;
  }
  return new t("the_geom", geom);
}

function toRow(geometry, geomToSoQL, properties, propToSoQL, crs) {
  var soqlGeom = geomToSoQL(geometry);

  var soqlProps = [];
  if (properties) {
    for (var k in properties) {
      soqlProps.push(propToSoQL(k, properties[k]));
    }
  }

  return {
    columns: [soqlGeom].concat(soqlProps),
    crs: crs
  };
}

exports.toRow = toRow;
exports.geomToSoQL = geomToSoQL;
exports.propToSoQL = propToSoQL;
exports.geoJsToSoQL = geoJsToSoQL;