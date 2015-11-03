import SoQLGeom from './geom';

class SoQLPolygon extends SoQLGeom {
  static ctype() {
    return 'polygon';
  }

  mapCoordinates(fn) {
    return this._value.map((coords) => (coords.map((coord) => fn(coord))));
  }
}


module.exports = SoQLPolygon;