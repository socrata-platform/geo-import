/**
 * Convert a stream of geojson into a stream
 * of SoQLValues.
 *
 * TODO: hierarchical CRS via geometry collections (;_;)
 */
import JSONStream from 'JSONStream';
import es from 'event-stream';
import _ from 'underscore';
import {
  toRow, geomToSoQL, propToSoQL
}
from './transform';
import {
  types
}
from '../soql/mapper';
import {
  Transform
}
from 'stream';


/**
  Turn the feature into a SoQLType. If no mapping exists, it will get filtered
  out of the pipe
*/
function featureToSoQL(feature) {
  if (!feature.type || (feature.type.toLowerCase() !== 'feature')) {
    console.log(typeof feature);
    console.error("Not a valid feature. Omitting feature: ", feature);
    return false;
  }

  if (!feature.geometry) {
    console.error("No Geometry defined. Omitting feature: ", feature);
    return false;
  }

  var crs = false;
  if (feature.crs) {
    if (feature.crs.href) {
      console.warn("No support for linked CRS yet. Omitting feature: ", feature);
      return false;
    }
    crs = feature.crs.properties.name;
  }
  return toRow(feature.geometry, geomToSoQL, feature.properties, propToSoQL, crs);
}


class GeoJSON extends Transform {

  constructor() {
    super({
      objectMode: true
    });
    this._featureStream = JSONStream.parse("features.*").on('data', (thing) => {

      this._onFeature(thing);
    }.bind(this));
    this._crsStream = JSONStream.parse("crs.*").on('data', (thing) => {

      this._onCrs(thing);
    }.bind(this));
  }

  _onFeature(feature) {
    var soqlFeature = featureToSoQL(feature);
    if(soqlFeature) this.push(soqlFeature);
  }

  _onCrs(crs) {
    if (crs.href) return this.emit("error", "No support for linked CRS yet");

    // console.log("parser emit!", crs);
    if (crs.name) return this.push({
      defaultCrs: crs.name
    });
  }

  _transform(chunk, encoding, done) {
    this._crsStream.write(chunk);
    this._featureStream.write(chunk);
    done();
  }
}

export default GeoJSON;