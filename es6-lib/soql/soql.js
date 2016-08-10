import _ from 'underscore';
import changeCase from 'change-case';


function launderName(name) {
  name = name.trim();
  //_.isNumber(NaN) === true...so that's why i'm not using it here
  var isNumber = !_.isNaN(parseInt(name[0]));

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