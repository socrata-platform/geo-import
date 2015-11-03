import SoQLGeom from './geom';

class SoQLPoint extends SoQLGeom {
  mapCoordinates(fn) {
    return fn(this.value.coordinates);
  }

  static ctype() {
    return 'point';
  }
}


module.exports = SoQLPoint;