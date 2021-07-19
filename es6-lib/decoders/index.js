import _ from 'underscore';
import GeoJSON from './geojson';
import KML from './kml';
import KMZ from './kmz';
import Shapefile from './shapefile';
import path from 'path';
import {DecodeFiletypeError} from '../errors';

function getDecoderForContentType(req, disk) {
  var ctype = req.headers['content-type'];
  var decoder = _.find([GeoJSON, KML, KMZ, Shapefile], (k) => _.contains(k.canDecode(), ctype));
  if(!decoder) return [new DecodeFiletypeError(ctype), false];
  req.log.info(`Selected decoder ${decoder.name} to parse request`);
  return [false, new decoder(disk)];
}

function getDecoderForExtension(filename, disk) {
  const extension = path.extname(filename);
  var decoder = _.find([GeoJSON, KML, KMZ, Shapefile], (k) => {
    return _.contains(k.canDecodeExtensions(), extension.toLowerCase());
  });
  if(!decoder) return [new DecodeFiletypeError(filename), false];
  return [false, new decoder(disk)];
}

export {getDecoderForContentType, getDecoderForExtension};