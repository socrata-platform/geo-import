import SoQLGeom from './geom';

class SoQLLine extends SoQLGeom {
  static ctype() {
    return 'linestring';
  }

  mapCoordinates(fn) {
    return this._value.map((coord) => fn(coord));
  }
}

module.exports = SoQLLine;