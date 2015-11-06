import SoQLGeom from './geom';

class SoQLPoint extends SoQLGeom {
  mapCoordinates(fn) {
    return fn(this._value);
  }

  get _type() {
    return 'Point';
  }

  static ctype() {
    return 'point';
  }
}


module.exports = SoQLPoint;