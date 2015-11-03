import * as JSONStream from 'JSONStream' ;
import * as es from 'event-stream' ;
import {types} from '../soql/mapper';
import {PassThrough} from 'stream';

function geomToSoQL(geom) {
  var ctype = geom.type.toLowerCase();
  var t = types[ctype];
  if (!t) {
    console.error("Invalid geometry type", ctype, types, "are the types available");
    return false;
  }
  return new t("the_geom", geom);
}

function propToSoQL(name, value) {
  var t = types[typeof value];
  if(!t) {
    console.error("Invalid property type", typeof value);
    return false;
  }
  return new t(name, value);
}


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
    crs = feature.crs.properties.name
  }

  var soqlGeom = geomToSoQL(feature.geometry);

  var soqlProps = [];
  if (feature.properties) {
    soqlProps = Object.keys(feature.properties).map(function(name) {
      return propToSoQL(name, feature.properties[name]);
    });
  }

  return {columns: [soqlGeom].concat(soqlProps), crs: crs};
}


class GeoJSON {


  toFeatures(stream) {
    var featureStream = new PassThrough()
    var crsStream = new PassThrough()

    var mergeStream = stream.pipe(featureStream)
      .pipe(es.map(function(buf, cb) {
        return cb(false, buf.toString('utf-8'))
      }))
      .pipe(JSONStream.parse("features.*"))
      .pipe(es.map(function(feature, cb) {
        try {
          return cb(false, featureToSoQL(feature));
        } catch (e) {
          console.error(e);
          return cb(e);
        }
      }))

    stream.pipe(crsStream)
    .pipe(JSONStream.parse("crs.*"))
    .pipe(es.map(function(crs, cb) {
      if(crs.href) return cb("No support for linked CRS yet");
      if(crs.name) mergeStream.emit('data', {defaultCrs: crs.name});
    }))

    return mergeStream;
  }

}

export default GeoJSON