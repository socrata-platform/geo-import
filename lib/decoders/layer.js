/**
 * Layer is a 1:1 mapping to a dataset. It has a set
 * schema. On creation, it opens a temp file
 * and will flush features (SoQLValues) to it as they're written
 * to the layer.
 */
import _ from 'underscore';
import fs from 'fs';
import es from 'event-stream';
import uuid from 'uuid';
import {
  EventEmitter
}
from 'events';
import ldj from 'ldjson-stream';
import srs from 'node-srs';
import BBox from '../util/bbox';
import {
  Duplex
}
from 'stream';
import {
  types
}
from '../soql/mapper';
import logger from '../util/logger';
import conf from '../config';

var config = conf();
const scratchPrologue = "";
const scratchSeparator = "\n";
const scratchEpilogue = "";

const jsonPrologue = "[";
const jsonSeparator = ",";
const jsonEpilogue = "]";

const WGS84 = '+proj=longlat +ellps=WGS84 +no_defs';


class Layer extends Duplex {

  constructor(columns, position, disk) {
    if (position === undefined) throw new Error("Need a layer index!");
    super();
    this._position = position;

    this.columns = columns;
    this._count = 0;
    this._crsMap = {};
    this._projectTo = srs.parse(WGS84);

    this._bbox = new BBox();

    if(disk) {
      this._outName = '/tmp/import_' + uuid.v4() + '.ldjson';
      this._out = disk.allocate(this._outName);
      this._out.write(scratchPrologue);
    }

    this.bufferedRows = [];
  }


  toJSON() {
    return {
      count: this.count,
      projection: this.defaultCrs.pretty_wkt,
      name: this.name,
      geometry: this.geomType,
      bbox: this._bbox.toJSON(),
      columns: this.columns.map((c) => c.toJSON())
    };
  }

  get name() {
    return `layer_${this._position}`;
  }

  belongsIn(soqlRow) {
    for(var i = 0; i < this.columns.length; i++) {
      let column = this.columns[i];
      let soqlValue = soqlRow[i];

      let nameMatch = column.rawName === soqlValue.rawName;
      if(!nameMatch) return false;

      let typeMatch = column.ctype === soqlValue.ctype;
      let isEmpty = (column.ctype === 'null' || soqlValue.ctype === 'null');
      if(!typeMatch && !isEmpty) return false;
    }
    return true;
  }

  get geomType() {
    var geom = this.columns.find((col) => col.isGeometry);
    if (!geom) return null;
    return geom.dataTypeName;
  }

  set defaultCrs(urn) {
    this._defaultCrs = srs.parse(urn);
  }

  get defaultCrs() {
    return this._defaultCrs;
  }

  get projections() {
    return Object.values(this._crsMap);
  }

  write(crs, soql, throwaway) {
    if (crs) {
      this._crsMap[this._count] = crs;
    }

    this._count++;
    if(throwaway) return;
    logger.debug(`Wrote scratch row: ${this._count}`);


    this.bufferedRows.push(soql);
    if(this.bufferedRows.length > config.spillRowsToDiskAfter) {
      this._spillToDisk();
    }
  }

  _spillToDisk() {
    logger.info(`Wrote ${this._count} to ${this.name} rows`);
    this._out.write(this.bufferedRows.map((soql) => {
      return this._scratchSeparator(this._count) + JSON.stringify(soql.map((r) => r.value));
    }).join('\n'));
    this.bufferedRows = [];
  }

  _scratchSeparator(index) {
    return index === 0 ? '' : scratchSeparator;
  }

  _jsonSeparator(index) {
    return index === 0 ? '' : jsonSeparator;
  }

  close(cb) {
    this._spillToDisk();
    this._out.write(scratchEpilogue);
    this._out.on('finish', cb);
    this._out.end();
  }

  get count() {
    return this._count;
  }

  _expandBbox(geom) {
    //yes a map is silly here because this is a side effect on the layer
    //but it keeps things simple
    geom.mapCoordinates((coord) => {
      this._bbox.expand(coord);
    });
  }

  _getDefaultProjection() {
    return this._defaultCrs || this._projectTo;
  }

  _getProjectionFor(index) {
    if (!this._crsMap[index]) return this._getDefaultProjection();
    return srs.parse(this._crsMap[index]);
  }

  //TODO: this is specific to a particular upstream so it should not live in the layer
  pipe(into) {
    logger.info(`Starting pipe of ${this.name}`);
    var index = 0;
    into.write(jsonPrologue);

    return this.read()
      .on('end', into.end.bind(into))
      .pipe(es.map((row, cb) => {
        var sep = this._jsonSeparator(index);
        var ep = '';
        index++;
        if (index === this._count) ep = jsonEpilogue;

        var asSoda = row.reduce((acc, col) => {
          acc[col.name] = col.value;
          return acc;
        }, {});

        var rowString = sep + JSON.stringify(asSoda) + ep;
        return cb(false, rowString);
      }))
      .on('error', (e) => {
        //caller is reponsible for cleaning up the stream when
        //an error happens
        into.emit('error', e);
      })
      .pipe(into);
  }

  /**
    Read the rows back out from the scratch file that was written
    as their SoQL reps, and reproject them into WGS84

    @sideeffect: update the layer's _bbox property after the geometry
                 is reprojected. this expands the bbox if the geometry
                 lies outside of the bbox. After all features have been
                 read then _bbox will encompass all of them
  */
  read() {
    logger.info(`Reading scratch file ${this._outName}`);
    var projectTo = this._projectTo,
      defaultCrs = this._defaultCrs,
      index = 0;

    var ee = new EventEmitter();


    // return ee;


    return fs.createReadStream(this._outName)
      .pipe(ldj.parse())
      .pipe(es.map((row, cb) => {
        var soqlValue = _.zip(this.columns, row).map(([column, value]) => {
          var soql = new types[column.ctype](column.rawName, value);
          if (soql.isGeometry) {
            logger.info("Reprojecting a geom");
            let projection = this._getProjectionFor(index);
            let geom = soql.reproject(projection, projectTo);
            this._expandBbox(geom);
            return geom;
          }
          return soql;
        });
        index++;
        cb(false, soqlValue);
      }));
  }
}



export default Layer;