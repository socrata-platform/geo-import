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

  get vertexCount() {
    return this._value.length;
  }
}

module.exports = SoQLMultiPoint;
