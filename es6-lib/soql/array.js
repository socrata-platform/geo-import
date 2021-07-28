import SoQL from './soql';

class SoQLArray extends SoQL {
  static ctype() {
    return 'array';
  }
}

export default SoQLArray;
