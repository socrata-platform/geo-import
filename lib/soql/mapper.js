var SoQLPoint = require('./point'),
  SoQLLine = require('./line'),
  SoQLPolygon = require('./polygon'),
  SoQLMultiPoint = require('./multipoint'),
  SoQLMultiLine = require('./multiline'),
  SoQLMultiPolygon = require('./multipolygon');

var SoQLText = require('./text'),
  SoQLBoolean = require('./boolean'),
  SoQLNumber = require('./number'),
  SoQLArray = require('./array'),
  SoQLObject = require('./object');




var geomTypes = {
  'point': SoQLPoint,
  'linestring': SoQLLine,
  'polygon': SoQLPolygon,
  'multipoint': SoQLMultiPoint,
  'multilinestring': SoQLMultiLine,
  'multipolygon': SoQLMultiPolygon
};

var types = {
  'string': SoQLText,
  'boolean': SoQLBoolean,
  'number': SoQLNumber,
  'array': SoQLArray,
  'object': SoQLObject
};

var soqlByName = {
  SoQLPoint: SoQLPoint,
  SoQLLine: SoQLLine,
  SoQLPolygon: SoQLPolygon,
  SoQLMultiPoint: SoQLMultiPoint,
  SoQLMultiLine: SoQLMultiLine,
  SoQLMultiPolygon: SoQLMultiPolygon,
  SoQLText: SoQLText,
  SoQLBoolean: SoQLBoolean,
  SoQLNumber: SoQLNumber,
  SoQLArray: SoQLArray,
  SoQLObject: SoQLObject
}

export {geomTypes, types, soqlByName}