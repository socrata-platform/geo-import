import * as _ from 'underscore';
import * as fs from 'fs';
import * as es from 'event-stream';
import * as uuid from 'uuid';
import * as ldj from 'ldjson-stream';
import * as srs from 'node-srs';
import {
  types
}
from '../soql/mapper';

const scratchPrologue = "";
const scratchSeparator = "\n";
const scratchEpilogue = "";

const jsonPrologue = "[";
const jsonSeparator = ",";
const jsonEpilogue = "]";

const WGS84 = '+proj=longlat +ellps=WGS84 +no_defs';

class Layer {

  constructor(columns, position) {
    if(position === undefined) throw new Error("Need a layer index!");
    this._position = position;
    this.columns = columns;
    this._count = 0;
    this._crsMap = {};
    this._projectTo = srs.parse(WGS84);

    this._outName = '/tmp/import_' + uuid.v4() + '.ldjson';
    this._out = fs.createWriteStream(this._outName);
    this._out.write(scratchPrologue);
  }


  get name() {
    return `layer_${this._position}`;
  }

  belongsIn(soqlRow) {
    return _.every(_.zip(this.columns, soqlRow), ([column, soqlValue]) => {
      return column.name === soqlValue.name && column.ctype === soqlValue.ctype;
    });
  }

  setDefaultCrs(urn) {
    this._defaultCrs = srs.parse(urn);
  }

  write(crs, soqlRow) {
    if(crs) {
      this._crsMap[this._count] = crs;
    }
    this._out.write(this._scratchSeparator(this._count) + JSON.stringify(soqlRow.map((r) => r.value)));
    this._count++;
  }

  _scratchSeparator(index) {
    return index === 0 ? '' : scratchSeparator;
  }

  _jsonSeparator(index) {
    return index === 0 ? '' : jsonSeparator;
  }

  close(cb) {
    this._out.write(scratchEpilogue);
    this._out.on('finish', cb);
    this._out.end();
  }

  get count() {
    return this._count;
  }

  _getDefaultProjection() {
    return this._defaultCrs || this._projectTo;
  }

  _getProjectionFor(index) {
    if(!this._crsMap[index]) return this._getDefaultProjection();
    return srs.parse(this._crsMap[index]);
  }

  pipe(into) {
    var index = 0;
    into.write(jsonPrologue);

    return this.read()
    .pipe(es.map((row, cb) => {
      var sep = this._jsonSeparator(index);
      var ep = '';
      index++;
      if(index === this._count) ep = jsonEpilogue;

      var asSoda = row.reduce((acc, col) => {
        acc[col.name] = col.value;
        return acc;
      }, {})

      var rowString = sep + JSON.stringify(asSoda) + ep;
      return cb(false, rowString);
    }.bind(this)))
    .pipe(into);
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
        var soqlValue = _.zip(this.columns, row).map(([column, value]) => {
          var soql = new types[column.ctype](column.name, value);
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