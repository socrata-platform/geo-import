/* eslint-env node */
import _ from 'underscore';

var SoQLNull = require('./null');

var soqls = [
  require('./point'),
  nullIfNoCoords(require('./line')),
  nullIfNoCoords(require('./polygon')),
  require('./multipoint'),
  require('./multiline'),
  require('./multipolygon'),
  require('./text'),
  require('./boolean'),
  require('./number'),
  require('./array'),
  require('./date'),
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

export {
  types
};
