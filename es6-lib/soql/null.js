import SoQL from './soql.js';

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

export default SoQLNull;
