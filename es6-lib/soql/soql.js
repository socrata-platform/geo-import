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
    name = changeCase.snakeCase(name);
    if(!_.isNaN(parseInt(name[0]))) {
      name = '_' + name;
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