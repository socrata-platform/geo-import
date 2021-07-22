import SoQLGeom from './geom.js';
import SoQLLine from './line.js';

class SoQLMultiLine extends SoQLGeom {
  get _type() {
    return 'MultiLineString';
  }

  static ctype() {
    return 'multilinestring';
  }

  fixSemantics() {
    this._value = this._value.map(SoQLLine.linify);
    return this;
  }

  mapCoordinates(fn) {
    return this._value.map((coords) => (coords.map(fn)));
  }

  get vertexCount() {
    return this._value.reduce((acc, coords) => acc + coords.length, 0);
  }
}

export default SoQLMultiLine;
