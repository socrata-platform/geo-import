import _ from 'underscore';
import {
  Transform
}
from 'stream';
import config from '../config';
import {
  types
}
from '../soql/mapper';
import srs from 'node-srs';
import BBox from '../util/bbox';
import logger from '../util/logger';

const WGS84 = '+proj=longlat +ellps=WGS84 +no_defs';

class WGS84Reprojector extends Transform {

  constructor(columns) {
    super({
      objectMode: true,
      highWaterMark: config().rowBufferSize
    });
    this._columns = columns;
    this._projectTo = srs.parse(WGS84);
    this._bbox = new BBox();
  }

  get projection() {
    return this._projectTo;
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
      var reprojected = _.zip(this._columns, row).map(([column, value]) => {
        var soql = new types[column.ctype](column.rawName, value);
        if (soql.isGeometry) {

          if (!soql.isCorrectArity()) {
            logger.error(`Found invalid arity with geom ${soql}`);
            throw new Error({
              message: "Invalid arity",
              row: row
            });
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

export
default WGS84Reprojector;