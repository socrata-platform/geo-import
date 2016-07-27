import _ from 'underscore';
import srs from 'node-srs';
import {
  Transform
}
from 'stream';
import config from '../config';
import logger from '../util/logger';
import {InvalidProjection} from '../errors';

const WGS84 = '+proj=longlat +ellps=WGS84 +no_defs';

class ProjectionTracker extends Transform {

  constructor() {
    super({
      objectMode: true,
      highWaterMark: config().rowBufferSize
    });

    this._defaultCrs = srs.parse(WGS84);
    this._crsMap = {};
    this._crsCache = {};
    this._prjIndex = 0;

  }

  setDefaultCrs(urn) {
    this._defaultCrs = srs.parse(urn);
  }

  getDefaultCrs() {
    return this._defaultCrs;
  }

  tell(index, crs) {
    if (crs) this._crsMap[index] = crs;
  }

  get all() {
    return Object.values(this._crsMap);
  }


  /**
   * Returns the projection for the row at index
   */
  _getProjectionFor() {
    if (!this._crsMap[this._prjIndex]) return this._defaultCrs;
    var unparsed = this._crsMap[this._prjIndex];
    if (!this._crsCache[unparsed]) {
      this._crsCache[unparsed] = srs.parse(unparsed);
    }
    return this._crsCache[unparsed];
  }

  _transform(row, _encoding, done) {
    let proj = this._getProjectionFor();

    if(!proj.valid) {
      this._prjIndex++;
      return done(new InvalidProjection(proj.input));
    }
    this._prjIndex++;
    done(false, [proj, row]);
  }
}

export
default ProjectionTracker;