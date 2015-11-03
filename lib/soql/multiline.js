import SoQLGeom from './geom';

class SoQLMultiLine extends SoQLGeom {
  static ctype() {
    return 'multilinestring';
  }
}

module.exports = SoQLMultiLine;