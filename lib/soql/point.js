import SoQLGeom from './geom';

class SoQLPoint extends SoQLGeom {
  mapCoordinates(fn) {
    return fn(this.value);
  }
}


module.exports = SoQLPoint;