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
import {types} from '../soql/mapper';

function layerFor(layers, soqlRow) {
  var columns = soqlRow.columns;
  var layer = _.find(layers, (layer) => layer.belongsIn(columns));
  if(!layer) {
    layer = new Layer(columns.map((datum) => new types[datum.ctype](datum.name)), layers.length);
    layers.push(layer);
  }
  return [layers, layer];
}


module.exports.toLayers = function(stream, cb) {
  //TODO: can be rewritten as a reduce
  var layers = [],
    defaultCrs = "urn:ogc:def:crs:OGC:1.3:CRS84";

  stream
  .on('data', function(soqlRow) {

    if(soqlRow && soqlRow.defaultCrs) {
      defaultCrs = soqlRow.defaultCrs;
      return
    }

    var [newLayers, layer] = layerFor(layers, soqlRow);
    layer.write(soqlRow.crs, soqlRow.columns);
    layers = newLayers
  }).on('end', function() {
    layers.forEach((layer) => layer.defaultCrs = defaultCrs);
    var onClosed = _.after(layers.length, _.partial(cb, false, layers));
    layers.forEach((layer) => layer.close(onClosed));
  });
}