import _ from 'underscore';
import SoQLGeom from './geom';
import logger from '../util/logger';

class SoQLPolygon extends SoQLGeom {
  get _type() {
    return 'Polygon';
  }

  static ctype() {
    return 'polygon';
  }

  static closeRings(poly) {
    poly.map((ring) => {
      var [x0, y0] = _.first(ring);
      var [xn, yn] = _.last(ring);
      if((x0 !== xn) || (y0 !== yn)) {
        logger.warn(`Polygon has unclosed ring! (${x0}, ${y0}) !== (${xn}, ${yn}).\
          Appending (${x0}, ${y0}) to the ring to make it valid`);
        ring.push([x0, y0]);
      }
      if(ring.length < 4) {
        for(var i = 0; i <= 4 - ring.length; i++) {
          ring.push([x0, y0]);
        }
      }
      return ring;
    });
    return poly;
  }

  fixSemantics() {
    this._value = SoQLPolygon.closeRings(this._value);
    return this;
  }

  mapCoordinates(fn) {
    return this._value.map((coords) => (coords.map(fn)));
  }

  get vertexCount() {
    return this._value.reduce((acc, coords) => acc + coords.length, 0);
  }
}

module.exports = SoQLPolygon;