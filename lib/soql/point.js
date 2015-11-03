import SoQLGeom from './geom';

class SoQLPoint extends SoQLGeom {
  mapCoordinates(fn) {
    return fn(this._value);
  }

  static ctype() {
    return 'point';
  }
}


module.exports = SoQLPoint;