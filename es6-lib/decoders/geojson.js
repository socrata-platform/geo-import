/**
 * Convert a stream of geojson into a stream
 * of SoQLValues.
 *
 * TODO: hierarchical CRS via geometry collections (;_;)
 */
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
import Parser from '../util/parser';
import config from '../config';
import {ParseError} from '../errors';

class GeoJSON extends Transform {

  constructor() {
    super({
      objectMode: true,
      highWaterMark: config().rowBufferSize
    });

    var err = this._onError.bind(this);

    this._featureParser = new Parser('features.*')
    .on('error', err)
    .on('data', this._onFeature.bind(this));
    this._crsParser = new Parser('crs.properties.name')
    .on('error', err)
    .on('data', this._onCrs.bind(this));
  }

  static canDecode() {
    return ['application/json'];
  }

  _onError(err) {
    var parserState = this._crsParser.getError() || this._featureParser.getError() || {};
    var [_m, reason] = /Error: ([\w ]+)/.exec(err);
    this.emit('error', new ParseError({
      lineNumber: parserState.line,
      column: parserState.column,
      token: parserState.token,
      reason: reason || 'Parse Error'
    }));
  }

  _onFeature(feature) {
    var soqlFeature = geoJsToSoQL(feature);
    if (soqlFeature) this.push(soqlFeature);
  }

  _onCrs(crs) {
    return this.push({
      defaultCrs: crs
    });
  }

  _transform(chunk, encoding, done) {
    this._crsParser.write(chunk);
    this._featureParser.write(chunk);
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