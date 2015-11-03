import SoQLGeom from './geom';

class SoQLLine extends SoQLGeom {
  static ctype() {
    return 'linestring';
  }
}

module.exports = SoQLLine;