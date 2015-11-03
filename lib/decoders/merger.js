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
    layers.forEach((layer) => layer.setDefaultCrs(defaultCrs));
    var onClosed = _.after(layers.length, _.partial(cb, false, layers));
    layers.forEach((layer) => layer.close(onClosed));
  });
}