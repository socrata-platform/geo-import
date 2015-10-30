import proj4 from 'proj4';
import SoQL from './soql';
import * as srs from 'node-srs';

class SoQLGeom extends SoQL {
  get isGeometry() {
    return true;
  }

  reproject(from, to) {
    if(from.input !== to.input) {
      this.value = this.mapCoordinates((coord) => proj4(from.proj4, to.proj4, coord))
      return this;
    }
    return this;
  }

  mapCoordinates(fn) {
    throw new Error("Not implemented!")
  }
}

export default SoQLGeom;