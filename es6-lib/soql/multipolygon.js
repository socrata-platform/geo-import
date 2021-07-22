import SoQLGeom from './geom.js';
import SoQLPolygon from './polygon.js';

class SoQLMultiPolygon extends SoQLGeom {
  get _type() {
    return 'MultiPolygon';
  }


  static ctype() {
    return 'multipolygon';
  }

  fixSemantics() {
    this._value = this._value.map(SoQLPolygon.closeRings);
    return this;
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

export default SoQLMultiPolygon;
