import _ from 'underscore';
import SoQL from './soql';

class SoQLDate extends SoQL {
  constructor(name, value) {
    super(name, value);
    if(_.isDate(value)) {
      this.value = value.toISOString();
    }
  }

  static ctype() {
    return 'date';
  }
}

module.exports = SoQLDate;