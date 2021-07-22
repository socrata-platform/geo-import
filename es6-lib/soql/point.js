import SoQLGeom from './geom.js';

class SoQLPoint extends SoQLGeom {
  mapCoordinates(fn) {
    return fn(this._value);
  }

  get _type() {
    return 'Point';
  }

  static ctype() {
    return 'point';
  }

  get vertexCount() {
    return 1;
  }
}

export default SoQLPoint;
