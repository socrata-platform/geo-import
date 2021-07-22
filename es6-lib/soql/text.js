import SoQL from './soql.js';

class SoQLText extends SoQL {
  constructor(name, value, prohibitedNames) {
    super(name, value, prohibitedNames);
    /**
     * Underlying shapefile parser gives back
     * '\u0000' for null values in text columns
     * rather than just null or ''. This breaks
     * downstream services. So convert this
     * special case to an empty string.
     */
    if (this.value == '\u0000') this.value = '';
  }

  static ctype() {
    return 'string';
  }
}

export default SoQLText;
