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

  get vertexCount() {
    return this._value.length;
  }
}

module.exports = SoQLLine;
