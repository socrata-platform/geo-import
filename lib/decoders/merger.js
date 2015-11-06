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
 * TODO: should probably batch stuff, but this probably won't
 * be the bottleneck here.
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

const DEFAULT_CRS = "urn:ogc:def:crs:OGC:1.3:CRS84";

function layerFor(layers, soqlRow) {
  var columns = soqlRow.columns;
  var layer = _.find(layers, (layer) => layer.belongsIn(columns));
  if (!layer) {
    layer = new Layer(columns.map((datum) => new types[datum.ctype](datum.name)), layers.length);
    layers.push(layer);
  }
  return [layers, layer];
}

class Merger extends Transform {
  constructor() {
    super({
      objectMode: true
    });

    this._layers = [];
    this._defaultCrs = DEFAULT_CRS;
  }

  _transform(chunk, encoding, done) {
    if (chunk && chunk.defaultCrs) {
      this._defaultCrs = chunk.defaultCrs;
      return done();
    }

    var [newLayers, layer] = layerFor(this._layers, chunk);
    layer.write(chunk.crs, chunk.columns);
    this._layers = newLayers;

    return done();
  }

  end() {
    this._layers.forEach((layer) => {
      layer.defaultCrs = this._defaultCrs
    }.bind(this));
    //idk if this is a hack. sometimes you just can't tell with node...
    var onClosed = _.after(this._layers.length, () => {
      this.emit('end', this.layers);
    }.bind(this));
    this._layers.forEach((layer) => layer.close(onClosed));
  }

  get layers() {
    return this._layers;
  }
}


export default Merger;