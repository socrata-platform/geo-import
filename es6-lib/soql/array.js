import SoQL from './soql.js';

class SoQLArray extends SoQL {
  static ctype() {
    return 'array';
  }
}

export default SoQLArray;
