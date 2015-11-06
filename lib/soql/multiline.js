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
}

module.exports = SoQLMultiLine;
