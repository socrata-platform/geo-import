import SoQLGeom from './geom';

class SoQLPolygon extends SoQLGeom {
  get _type() {
    return 'Polygon';
  }

  static ctype() {
    return 'polygon';
  }

  mapCoordinates(fn) {
    return this._value.map((coords) => (coords.map(fn)));
  }
}


module.exports = SoQLPolygon;
