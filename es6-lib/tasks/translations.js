import errors from '../errors';
import _ from 'underscore';
import yaml from 'js-yaml';

console.log(yaml.safeDump(_.map(errors, (cls, name) => {
  return [cls.reason(), cls.template()];
}).reduce((acc, [reason, template]) => {
  acc.errors[reason] = template;
  return acc;
}, {
  errors: {}
})));