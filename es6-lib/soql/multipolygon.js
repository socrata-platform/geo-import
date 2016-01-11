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

  get vertexCount() {
    return this._value.reduce((acc, polygon) => {
      return acc + polygon.reduce((polyAcc, coords) => {
        return polyAcc + coords.length;
      }, 0);
    }, 0);
  }
}

module.exports = SoQLMultiPolygon;