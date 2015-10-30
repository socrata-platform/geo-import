import * as _ from 'underscore';
import * as fs from 'fs';
import * as es from 'event-stream';
import * as uuid from 'uuid';
import * as ldj from 'ldjson-stream';
import * as srs from 'node-srs';
import {
  geomTypes, types, soqlByName
}
from '../soql/mapper';

const prologue = "";
const epilogue = "";
const separator = "\n";

const WGS84 = '+proj=longlat +ellps=WGS84 +no_defs';

class Layer {

  constructor(columns) {
    this.columns = columns;
    this._count = 0;
    this._crsMap = {};
    this._projectTo = srs.parse(WGS84);

    this._outName = '/tmp/import_' + uuid.v4() + '.ldjson';
    this._out = fs.createWriteStream(this._outName);
    this._out.write(prologue);
  }

  get name() {
    return `layer_${this._count}`;
  }

  belongsIn(soqlRow) {
    return _.every(_.zip(this.columns, soqlRow), ([
      [cname, ctype], soqlValue
    ]) => {
      return cname === soqlValue.name && ctype === soqlValue.typeName;
    });
  }

  setDefaultCrs(urn) {
    this._defaultCrs = srs.parse(urn);
  }

  write(crs, soqlRow) {
    if(crs) {
      this._crsMap[this._count] = crs;
    }
    this._out.write(this._getSeparator() + JSON.stringify(soqlRow.map((r) => r.value)));
    this._count++;
  }

  _getSeparator() {
    return this._count === 0 ? '' : separator;
  }

  close(cb) {
    this._out.write(epilogue);
    this._out.on('finish', cb);
    this._out.end();
  }

  _getDefaultProjection() {
    return this._defaultCrs || this._projectTo;
  }

  _getProjectionFor(index) {
    if(!this._crsMap[index]) return this._getDefaultProjection();
    return srs.parse(this._crsMap[index]);
  }

  /**
    Read the rows back out from the scratch file that was written
    as their SoQL reps, and reproject them into WGS84
  */
  read() {
    var projectTo = this._projectTo,
        defaultCrs = this._defaultCrs,
        index = 0;
    return fs.createReadStream(this._outName)
      .pipe(ldj.parse())
      .pipe(es.map((row, cb) => {
        var soqlValue = _.zip(this.columns, row).map(([[cname, ctype], value]) => {
          var soql = new soqlByName[ctype](cname, value);
          if(soql.isGeometry) {
            let projection = this._getProjectionFor(index);
            return soql.reproject(projection, projectTo);
          }
          return soql;
        });
        index++;
        cb(false, soqlValue);
      }));
  }
}



export default Layer;