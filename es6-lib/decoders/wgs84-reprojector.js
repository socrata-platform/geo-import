import _ from 'underscore';
import { Transform } from 'stream';
import config from '../config/index.js';
import { types } from '../soql/mapper.js';
import srs from 'srs';
import BBox from '../util/bbox.js';
import { InvalidArityError } from '../errors.js';

const WGS84 = '+proj=longlat +ellps=WGS84 +no_defs';

class WGS84Reprojector extends Transform {

  constructor(logger) {
    super({
      objectMode: true,
      highWaterMark: config().rowBufferSize
    });
    this._projectTo = srs.parse(WGS84);
    this._bbox = new BBox();
    this.log = logger;
  }

  get projection() {
    return this._projectTo;
  }

  get projectionString() {
    return WGS84;
  }

  get bbox() {
    return this._bbox;
  }

  _expandBbox(geom) {
    //yes a map is silly here because this is a side effect on the layer
    //but it keeps things simple
    geom.mapCoordinates((coord) => {
      this.bbox.expand(coord);
    });
  }

  _transform([projection, row], _encoding, done) {
    try {
      var reprojected = row.map((soql) => {
        if (soql.isGeometry) {
          if (!soql.isCorrectArity()) {
            this.log.error(`Found invalid arity with geom ${soql}`);
            throw new InvalidArityError(row);
          }

          let geom = soql
            .fixSemantics()
            .reproject(projection, this.projection);
          this._expandBbox(geom);
          return geom;
        }
        return soql;
      });

      var asSoda = reprojected.reduce((acc, col) => {
        acc[col.name] = col.value;
        return acc;
      }, {});

      var asString = JSON.stringify(asSoda);
      return done(false, asString);
    } catch (e) {
      return done(e);
    }
  }
}

export default WGS84Reprojector;
