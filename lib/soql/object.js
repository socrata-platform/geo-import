import SoQL from './soql';

class SoQLObject extends SoQL {
  static ctype() {
    return 'object';
  }
}

module.exports = SoQLObject;