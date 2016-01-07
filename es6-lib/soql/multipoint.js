import SoQLGeom from './geom';

class SoQLMultiPoint extends SoQLGeom {
  get _type() {
    return 'MultiPoint';
  }


  static ctype() {
    return 'multipoint';
  }

  mapCoordinates(fn) {
    return this._value.map(fn);
  }
}

module.exports = SoQLMultiPoint;
