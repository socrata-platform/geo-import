import SoQLGeom from './geom';

class SoQLMultiPoint extends SoQLGeom {
  static ctype() {
    return 'multipoint';
  }

  mapCoordinates(fn) {
    return this._value.map((coord) => fn(coord));
  }
}

module.exports = SoQLMultiPoint;