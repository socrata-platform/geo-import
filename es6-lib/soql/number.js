import SoQL from './soql';

class SoQLNumber extends SoQL {
  static ctype() {
    return 'number';
  }
}

export default SoQLNumber;
