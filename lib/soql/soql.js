class SoQL {
  constructor(name, value) {
    this.name = name;
    this.value = value;
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
    return this.constructor.ctype()
  }



  get isGeometry() {
    return false;
  }
}

export default SoQL