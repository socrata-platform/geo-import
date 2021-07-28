import _ from 'underscore';
import SoQL from './soql';

class SoQLDate extends SoQL {
  constructor(name, value, prohibitedNames) {
    super(name, value, prohibitedNames);
    if(_.isDate(value)) {
      this.value = value.toISOString();
    }
  }

  static ctype() {
    return 'date';
  }
}

export default SoQLDate;
