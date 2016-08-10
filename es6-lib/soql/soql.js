import _ from 'underscore';
import changeCase from 'change-case';


function launderName(name) {
  name = name.trim();
  //_.isNumber(NaN) === true...so that's what i'm not using it here
  var isNumber = !_.isNaN(parseInt(name[0]));

  // Suppose we have columns in one layer
  // called `NAME` and `name`, snakecase itself will convert
  // these to `name` and `name`. So we need to convert them
  // to `__name` and `name` so they don't collide.
  // Why the double underscore?
  // Suppose we have columns in one layer
  // called 'ID'. Single underscore would be converted
  // to `_id` which is reserved. So a double underscore fixes
  // this ;_;
  var l = name;
  name = changeCase.snakeCase(name);
  if (isNumber) {
    name = '_' + name;
  }
  return name;
}

class SoQL {
  constructor(name, value) {
    this.rawName = name;
    this.name = launderName(name);
    this.value = value;
  }

  /**
    Type name that core maps onto a SoQLType
  */
  get dataTypeName() {
    return this.constructor.name.slice(4).toLowerCase();
  }

  setName(name) {
    this.name = launderName(name);
    return this;
  }

  /**
    Javascript type that this SoQLType maps to
  */
  get ctype() {
    return this.constructor.ctype();
  }

  get isGeometry() {
    return false;
  }

  toJSON() {
    return {
      fieldName: this.name,
      name: this.rawName,
      dataTypeName: this.dataTypeName
    };
  }
}

export
default SoQL;