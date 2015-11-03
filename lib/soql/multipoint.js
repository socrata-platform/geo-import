import SoQLGeom from './geom';

class SoQLMultiPoint extends SoQLGeom {
  static ctype() {
    return 'multipoint';
  }
}

module.exports = SoQLMultiPoint;