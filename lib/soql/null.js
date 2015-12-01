import SoQL from './soql';

class SoQLNull extends SoQL {
  static ctype() {
    return 'null';
  }
}

module.exports = SoQLNull;