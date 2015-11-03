import SoQLGeom from './geom';

class SoQLPolygon extends SoQLGeom {
  static ctype() {
    return 'polygon';
  }
}


module.exports = SoQLPolygon;