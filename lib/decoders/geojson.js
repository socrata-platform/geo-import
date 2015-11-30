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
  toRow, geomToSoQL, propToSoQL, geoJsToSoQL
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

class GeoJSON extends Transform {

  constructor() {
    super({
      objectMode: true
    });
    this._featureStream = JSONStream.parse("features.*")
    .on('error', this._onError.bind(this))
    .on('data', this._onFeature.bind(this));

    this._crsStream = JSONStream.parse("crs.*")
    .on('error', this._onError.bind(this))
    .on('data', this._onCrs.bind(this));
  }



  static canDecode() {
    return ['application/json'];
  }

  _onError(err) {
    this.emit('error', err);
  }

  _onFeature(feature) {
    var soqlFeature = geoJsToSoQL(feature);
    if (soqlFeature) this.push(soqlFeature);
  }

  _onCrs(crs) {
    if (crs.href) return this.emit("error", "No support for linked CRS yet");
    if (crs.name) return this.push({
      defaultCrs: crs.name
    });
  }

  _transform(chunk, encoding, done) {
    this._crsStream.write(chunk);
    this._featureStream.write(chunk);
    done();
  }

  summarize(cb) {
    return cb(false, []);
  }

  canSummarizeQuickly() {
    return false;
  }
}

export default GeoJSON;