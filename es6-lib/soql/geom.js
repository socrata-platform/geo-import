import proj4 from 'proj4';
import SoQL from './soql';
import * as srs from 'node-srs';

class SoQLGeom extends SoQL {
  get isGeometry() {
    return true;
  }

  reproject(from, to) {
    if(from.input !== to.input) {
      this._value = this.mapCoordinates((coord) => proj4(from.proj4, to.proj4, coord));
      return this;
    }
    return this;
  }

  set value(v) {
    if(!v) return;
    if(!v.coordinates) throw new Error("Geometry needs coordinates");
    this._value = v.coordinates;
  }

  get value() {
    var n = this.ctype;
    return {
      'type': this._type,
      coordinates: this._value
    };
  }

  mapCoordinates(fn) {
    throw new Error("Not implemented!");
  }
}

export default SoQLGeom;