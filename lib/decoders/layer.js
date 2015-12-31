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
  static get EMPTY() {
    return '__empty__';
  }

  constructor(columns, position, disk, spec) {
    if (position === undefined) throw new Error("Need a layer index!");
    super();
    this._position = position;

    this.columns = columns;
    this._count = 0;
    this._crsMap = {};
    this._projectTo = srs.parse(WGS84);
    this._spec = spec || {};

    this._bbox = new BBox();

    if (disk) {
      this._outName = '/tmp/import_' + uuid.v4() + '.ldjson';
      this._out = disk.allocate(this._outName);
      this._out.write(scratchPrologue);
    }
  }

  toJSON() {
    return {
      count: this.count,
      projection: this.defaultCrs.name,
      name: this.name,
      geometry: this.geomType,
      bbox: this._bbox.toJSON(),
      columns: this.columns.map((c) => c.toJSON())
    };
  }

  get scratchName() {
    return this._outName;
  }

  get name() {
    return this._spec.name || `layer_${this._position}`;
  }

  get uid() {
    return this._spec.uid || Layer.EMPTY;
  }

  set uid(uid) {
    this._spec.uid = uid;
    return this;
  }

  belongsIn(soqlRow) {
    for (var i = 0; i < this.columns.length; i++) {
      let column = this.columns[i];
      let soqlValue = soqlRow[i];

      let nameMatch = column.rawName === soqlValue.rawName;
      if (!nameMatch) return false;

      let typeMatch = column.ctype === soqlValue.ctype;
      let isEmpty = (column.ctype === 'null' || soqlValue.ctype === 'null');
      if (!typeMatch && !isEmpty) return false;
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
    return this._defaultCrs || this._projectTo;
  }

  get projections() {
    return Object.values(this._crsMap);
  }

  /**
   * Layers are created on the fly. They are created when we encounter the
   * a soqlRow which does not fit in the set of layers that we know about.
   * _updateColumnTypes mutates the Layer's column types as values that
   * have more type info are written to it.
   *
   * An Example:
   *   A dataset is being read which looks like
   *   [
   *     ['a', 1, POINT(1, 2), null],
   *     ['b', 1, POINT(2, 3), 'something']
   *     ['c', 1, POINT(3, 4), null]
   *   ]
   *
   *
   *   When we encounter the first row, a Layer, layer0, is created with the first soqlRow:
   *     ['a', 1, POINT(1, 2), null]
   *   So we end up with layer0 that has columns of type
   *     [SoQLText, SoQLNumber, SoQLPoint, SoQLNull]
   *
   *   Then we encounter the second row, row1, which has more info about what the last
   *   column actually is.
   *     ['b', 1, POINT(2, 3), 'something']
   *   layer0.belongsIn(row1) will return true, so row1 will get written to layer0.
   *   layer0.write will call _updateColumnTypes to update its undefined columns to reflect
   *   the fact that it is now storing values with more type info than it had before.
   *
   * This is a little confusing and gross, and comes from the fact that this is
   * being written to the lowest common denominator (geoJSON, KML, KMZ) of type
   * info. ESRI shapefiles give more hints about types, though all those hints
   * are eliminated in the shapefile library being used.
   *
   * This could be written as a big map, but it is called on every write,
   * so it's important to return as early as possible.
   *
   * @mutates this.columns
   */
  _updateColumnTypes(soqlRow) {
    var undefinedColumns = this.columns.filter((c) => c.ctype === 'null');
    if (!undefinedColumns.length) return;

    var definedSoqlCols = soqlRow.filter((c) => c.ctype !== 'null');
    //We want the set of columns that are defined for the value, but are not defined
    //for the layer. These are the columns that we will replace in the layer.
    var toAdd = definedSoqlCols.filter((valCol) => {
      return undefinedColumns.find((col) => valCol.rawName === col.rawName);
    });

    if (toAdd.length === 0) return;

    this.columns = this.columns.map((col) => {
      var valCol = toAdd.find((newCol) => newCol.rawName === col.rawName);
      var newCol;
      if (valCol) {
        newCol = new valCol.constructor(valCol.rawName);
        logger.debug(`Replacing old undefined column ${valCol.rawName} with new ${valCol.constructor.name} column`);
      }
      return newCol || col;
    });
  }

  /**
   * Write the soqlRow with a given crs to the layer.
   * This will only be called if belongsIn returned true for the soqlRow and this layer.
   * See the note above on the confusing mutate-y  bits.
   * @param  {[type]} crs       [description]
   * @param  {[type]} soqlRow   [description]
   * @param  {[type]} throwaway [description]
   * @return {[type]}           [description]
   */
  write(crs, soqlRow, throwaway, done) {
    if (crs) this._crsMap[this._count] = crs;

    this._updateColumnTypes(soqlRow);
    this._count++;
    if (throwaway) {
      if (done) done();
      return;
    }

    this._out.write(
      this._scratchSeparator(this._count) + JSON.stringify(soqlRow.map((r) => r.value)) + '\n',
      null, done);
  }

  _scratchSeparator(index) {
    return index === 0 ? '' : scratchSeparator;
  }

  _jsonSeparator(index) {
    return index === 0 ? '' : jsonSeparator;
  }

  close(cb) {
    this._out.write(scratchEpilogue, null, () => {
      this._out.on('finish', () => {
        this.emit('readable');
        this._emittedReadable = true;
        cb();
      });
      this._out.end();
    });
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


  _getProjectionFor(index) {
    if (!this._crsMap[index]) return this.defaultCrs;
    return srs.parse(this._crsMap[index]);
  }


  _startPushing() {
    this._isPushing = true;
    var projectTo = this._projectTo;
    var index = 0;

    this.push(jsonPrologue);
    fs.createReadStream(this._outName)
      .pipe(ldj.parse())
      .pipe(es.map((row, cb) => {
        var soqlRow = _.zip(this.columns, row).map(([column, value]) => {
          var soql = new types[column.ctype](column.rawName, value);
          if (soql.isGeometry) {
            let projection = this._getProjectionFor(index);
            let geom = soql.reproject(projection, projectTo);
            this._expandBbox(geom);
            return geom;
          }
          return soql;
        });

        var sep = this._jsonSeparator(index);
        var ep = '';
        index++;
        if (index === this._count) ep = jsonEpilogue;

        var asSoda = soqlRow.reduce((acc, col) => {
          acc[col.name] = col.value;
          return acc;
        }, {});

        var rowString = sep + JSON.stringify(asSoda) + ep;
        this.push(rowString);
        cb();
      })).on('end', () => {
        this.push(null);
      });
  }

  /**
    Read the rows back out from the scratch file that was written
    as their SoQL reps, and reproject them into WGS84

    @sideeffect: update the layer's _bbox property after the geometry
                 is reprojected. this expands the bbox if the geometry
                 lies outside of the bbox. After all features have been
                 read then _bbox will encompass all of them
  */
  _read() {
    if (!this._emittedReadable && !this._isPushing) {
      this.once('readable', this._startPushing.bind(this));
    } else if (!this._isPushing) {
      this._startPushing();
    }
  }
}



export default Layer;