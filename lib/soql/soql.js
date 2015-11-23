import changeCase from 'change-case';


class SoQL {
  constructor(name, value) {
    this.name = this._launderName(name);
    this.value = value;
  }

  /**
   * This is all the old geo importer did.
   * TODO: this is necessary, but is this sufficient?
   */
  _launderName(name) {
    return changeCase.snakeCase(name);
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
}

export default SoQL;