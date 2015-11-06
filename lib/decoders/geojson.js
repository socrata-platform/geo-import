/**
 * Convert a stream of geojson into a stream
 * of SoQLValues.
 *
 * TODO: hierarchical CRS via geometry collections (;_;)
 */
import * as JSONStream from 'JSONStream' ;
import * as es from 'event-stream' ;
import {toRow, geomToSoQL, propToSoQL} from './transform';
import {types} from '../soql/mapper';
import {PassThrough} from 'stream';


/**
  Turn the feature into a SoQLType. If no mapping exists, it will get filtered
  out of the pipe
*/
function featureToSoQL(feature) {
  if (!feature.type || (feature.type.toLowerCase() !== 'feature')) {
    console.error("Not a valid feature. Omitting feature: ", feature);
    return false;
  }

  if (!feature.geometry) {
    console.error("No Geometry defined. Omitting feature: ", feature);
    return false;
  }

  var crs = false;
  if(feature.crs) {
    if(feature.crs.href) {
      console.warn("No support for linked CRS yet. Omitting feature: ", feature);
      return false;
    }
    crs = feature.crs.properties.name;
  }
  return toRow(feature.geometry, geomToSoQL, feature.properties, propToSoQL, crs);
}


class GeoJSON {

  toFeatures(stream) {

    var mergeStream = stream.pipe(
      es.map(function(buf, cb) {
        return cb(false, buf.toString('utf-8'));
      }))
      .pipe(JSONStream.parse("features.*"))
      .pipe(es.map((feature, cb) => {
        try {
          return cb(false, featureToSoQL(feature));
        } catch (e) {
          console.error(e);
          return cb(e);
        }
      }));

    stream
    .pipe(JSONStream.parse("crs.*"))
    .pipe(es.map((crs, cb) => {
      if(crs.href) return cb("No support for linked CRS yet");
      if(crs.name) mergeStream.emit('data', {defaultCrs: crs.name});
    }));

    return mergeStream;
  }

}

export default GeoJSON;