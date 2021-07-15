/* eslint-env node */
import _ from 'underscore';
import SoQLNull from './null.js';
import SoQLPoint from './point.js';
import SoQLLine from './line.js';
import SoQLPolygon from './polygon.js';
import SoQLMultiPoint from './multipoint.js';
import SoQLMultiLine from './multiline.js';
import SoQLMultiPolygon from './multipolygon.js';
import SoQLText from './text.js';
import SoQLBoolean from './boolean.js';
import SoQLNumber from './number.js';
import SoQLArray from './array.js';
import SoQLDate from './date.js';

var soqls = [
  SoQLPoint,
  nullIfNoCoords(SoQLLine),
  nullIfNoCoords(SoQLPolygon),
  SoQLMultiPoint,
  SoQLMultiLine,
  SoQLMultiPolygon,
  SoQLText,
  SoQLBoolean,
  SoQLNumber,
  SoQLArray,
  SoQLDate,
  SoQLNull
];

// GeoJSON doesn't allow representing certain types with emtpy coordinate lists.
function nullIfNoCoords(underlying) {
  var wrapped = function (name, value) {
    if (value && value.coordinates && value.coordinates.length > 0) {
      return new underlying(name, value);
    } else {
      return new SoQLNull(name);
    }
  };

  wrapped.ctype = function () {
    return underlying.ctype();
  };

  return wrapped;
}

var types = _.object(soqls.map((soql) => [soql.ctype(), soql]));

export { types };
