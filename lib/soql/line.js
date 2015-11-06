import SoQLGeom from './geom';

class SoQLLine extends SoQLGeom {
  get _type() {
    return 'LineString';
  }


  static ctype() {
    return 'linestring';
  }

  mapCoordinates(fn) {
    return this._value.map(fn);
  }
}

module.exports = SoQLLine;
