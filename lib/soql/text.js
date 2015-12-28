import SoQL from './soql';

class SoQLText extends SoQL {
  constructor(name, value) {
    super(name, value)
    if(this.value == '\u0000') this.value = '';
  }

  static ctype() {
    return 'string';
  }
}

module.exports = SoQLText;