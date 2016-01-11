import SoQLGeom from './geom';

class SoQLMultiLine extends SoQLGeom {
  get _type() {
    return 'MultiLineString';
  }

  static ctype() {
    return 'multilinestring';
  }

  mapCoordinates(fn) {
    return this._value.map((coords) => (coords.map(fn)));
  }

  get vertexCount() {
    return this._value.reduce((acc, coords) => acc + coords.length, 0);
  }
}

module.exports = SoQLMultiLine;
