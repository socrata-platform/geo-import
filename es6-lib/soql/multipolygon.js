import SoQLGeom from './geom';

class SoQLMultiPolygon extends SoQLGeom {
  get _type() {
    return 'MultiPolygon';
  }


  static ctype() {
    return 'multipolygon';
  }

  mapCoordinates(fn) {
    return this._value.map((polygon) => {
      return polygon.map((coords) => {
        return coords.map(fn);
      });
    });
  }
}

module.exports = SoQLMultiPolygon;
