import SoQL from './soql';

class SoQLNull extends SoQL {
  static ctype() {
    return 'null';
  }

  toJSON() {
    return {
      fieldName: this.name,
      name: this.rawName,
      dataTypeName: 'text'
    };
  }
}

module.exports = SoQLNull;