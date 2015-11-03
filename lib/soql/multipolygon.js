import SoQLGeom from './geom';

class SoQLMultiPolygon extends SoQLGeom {
  static ctype() {
    return 'multipolygon';
  }

  mapCoordinates(fn) {
    return this._value.map((polygon) => {
      return polygon.map((coords) => {
        return coords.map((coord) => fn(coord));
      });
    });
  }
}

module.exports = SoQLMultiPolygon;