import _ from 'underscore';

var soqls = [
  require('./point'),
  require('./line'),
  require('./polygon'),
  require('./multipoint'),
  require('./multiline'),
  require('./multipolygon'),
  require('./text'),
  require('./boolean'),
  require('./number'),
  require('./array'),
  require('./object')
];

var types = _.object(soqls.map((soql) => [soql.ctype(), soql]));

export {
  types
};