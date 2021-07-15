import errors from '../errors.js';
import _ from 'underscore';
import yaml from 'js-yaml';

console.log(yaml.safeDump(_.map(errors, (cls, name) => {
  return [cls.reason(), {
    title: cls.title(),
    description: cls.template()
  }];
}).reduce((acc, [reason, template]) => {
  acc.errors[reason] = template;
  return acc;
}, {
  errors: {}
})));
