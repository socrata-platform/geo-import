class SoQL {
  constructor(name, value) {
    this.name = name;
    this.value = value;
  }

  get dataTypeName() {
    return this.typeName().slice(4).toLowerCase();
  }

  get typeName() {
    return this.constructor.name;
  }

  get column() {
    return [this.name, this.typeName];
  }

  get isGeometry() {
    return false;
  }
}

export default SoQL