import SoQL from './soql';

class SoQLText extends SoQL {
  static ctype() {
    return 'string';
  }
}

module.exports = SoQLText;