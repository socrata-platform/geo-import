/**
 * Convert a stream of soql rows into a list of layers
 *
 * A new layer is created when a feature whos schema doesn't match any
 * existing layers is encountered. A feature belongs in a layer if it
 * has the same columns (name and type) as the layer
 *
 * Each layer opens a write stream on creation in a temporary location
 * and writes each feature to disk so things are not buffered
 * in memory.
 */

import _ from 'underscore';
import Layer from './layer';
import * as es from 'event-stream';
import {
  types
}
from '../soql/mapper';
import {
  Transform
}
from 'stream';
import Disk from './disk';
import logger from '../util/logger';
import async from 'async';

const DEFAULT_CRS = "urn:ogc:def:crs:OGC:1.3:CRS84";


class Merger extends Transform {
  constructor(disk, specs, throwaway) {
    super({
      objectMode: true
    });
    if (!disk) throw new Error("Merger needs a disk");
    this._specs = specs || [];
    this._throwaway = throwaway;
    this._disk = disk;
    this._layers = [];
    this._defaultCrs = DEFAULT_CRS;

    this.once('finish', this._onFinish);
  }

  _getOrCreateLayer(soqlRow, disk, spec) {
    var columns = soqlRow.columns;
    var layer = this._layers.find((layer) => layer.belongsIn(columns));
    if (!layer) {
      layer = new Layer(columns.map((soqlValue) => {
        let t = types[soqlValue.ctype];
        if (!t) {
          logger.warn(`No SoQLType found for ${soqlValue.ctype}, falling back to SoQLText`);
          t = types.string;
        }
        return new t(soqlValue.rawName);
      }), this._layers.length, disk, spec);
      this._layers.push(layer);
    }
    return layer;
  }

  _transform(chunk, encoding, done) {
    if (chunk && chunk.defaultCrs) {
      this._defaultCrs = chunk.defaultCrs;
      return done();
    }

    var spec = this._specs[this._layers.length];
    var layer = this._getOrCreateLayer(chunk, this._disk, spec);
    layer.write(chunk.crs, chunk.columns, this._throwaway, done);
  }

  _onFinish() {
    this._layers.forEach((layer) => {
      layer.defaultCrs = this._defaultCrs;
    });
    async.each(this._layers, (l, cb) => l.close(cb), (err) => {
      if(err) return this.emit('error', err);
      this.emit('end', this.layers);
    });
  }

  get layers() {
    return this._layers;
  }
}

export default Merger;