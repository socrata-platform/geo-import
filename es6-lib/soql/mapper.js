/* eslint-env node */
import _ from 'underscore';
import SoQLNull from './null';
import SoQLPoint from './point';
import SoQLLine from './line';
import SoQLPolygon from './polygon';
import SoQLMultiPoint from './multipoint';
import SoQLMultiLine from './multiline';
import SoQLMultiPolygon from './multipolygon';
import SoQLText from './text';
import SoQLBoolean from './boolean';
import SoQLNumber from './number';
import SoQLArray from './array';
import SoQLDate from './date';

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
