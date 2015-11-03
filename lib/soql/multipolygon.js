import SoQLGeom from './geom';

class SoQLMultiPolygon extends SoQLGeom {
  static ctype() {
    return 'multipolygon';
  }
}

module.exports = SoQLMultiPolygon;