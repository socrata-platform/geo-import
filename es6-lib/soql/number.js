import SoQL from './soql.js';

class SoQLNumber extends SoQL {
  static ctype() {
    return 'number';
  }
}

export default SoQLNumber;
