import SoQL from './soql';

class SoQLNumber extends SoQL {
  static ctype() {
    return 'number';
  }
}

module.exports = SoQLNumber;