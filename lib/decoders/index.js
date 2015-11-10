import _ from 'underscore';
import GeoJSON from './geojson';
import KML from './kml';
import KMZ from './kmz';
import Shapefile from './shapefile';

function getDecoder(req, disk) {
  var ctype = req.headers['content-type'];
  var decoder = [GeoJSON, KML, KMZ, Shapefile].find((k) => _.contains(k.canDecode(), ctype));
  if(!decoder) return [new Error(`No decoder found for ${ctype}`), false];
  return [false, new decoder(disk)];
}

export default getDecoder;