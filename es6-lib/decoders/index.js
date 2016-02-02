import _ from 'underscore';
import GeoJSON from './geojson';
import KML from './kml';
import KMZ from './kmz';
import Shapefile from './shapefile';
import {UnknownFileType} from '../errors';

function getDecoder(req, disk) {
  var ctype = req.headers['content-type'];
  var decoder = _.find([GeoJSON, KML, KMZ, Shapefile], (k) => _.contains(k.canDecode(), ctype));
  if(!decoder) {
    var error = new UnknownFileType({
      extension: ctype
    });
    return [error, false];
  }
  req.log.info(`Selected decoder ${decoder.name} to parse request`);
  return [false, new decoder(disk)];
}

export default getDecoder;