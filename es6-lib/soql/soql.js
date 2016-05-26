import _ from 'underscore';
import changeCase from 'change-case';


class SoQL {
  constructor(name, value) {
    this.rawName = name;
    this.name = this._launderName(name);
    this.value = value;
  }

  /**
   * This is all the old geo importer did.
   * TODO: this is necessary, but is this sufficient?
   */
  _launderName(name) {
    name = name.trim();
    var start = name[0];
    var isNumber = !_.isNaN(parseInt(start));
    var isUpper = start.toUpperCase() === start;


    // Suppose we have columns in one layer
    // called `NAME` and `name`, snakecase itself will convert
    // these to `name` and `name`. So we need to convert them
    // to `__name` and `name` so they don't collide.
    // Why the double underscore?
    // Suppose we have columns in one layer
    // called 'ID'. Single underscore would be converted
    // to `_id` which is reserved. So a double underscore fixes
    // this ;_;

    name = changeCase.snakeCase(name);
    if(isNumber) {
      name = '_' + name;
    } else if(isUpper) {
      name = '__' + name;
    }
    return name;
  }

  /**
    Type name that core maps onto a SoQLType
  */
  get dataTypeName() {
    return this.constructor.name.slice(4).toLowerCase();
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

export default SoQL;