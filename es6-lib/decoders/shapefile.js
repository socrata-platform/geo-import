/**
 * Convert a shapefile into SoQL Values
 *
 * NOTE: this is not pausable! pause will
 * put the stream into a paused state forever,
 * and resume will not work.
 * TODO: if this functionality is needed at some point,
 * need to revisit it.
 */
import es from 'event-stream';
import _ from 'underscore';
import {
  geoJsToSoQL
}
from './transform';
import {
  Duplex
}
from 'stream';
import BBox from '../util/bbox';
import shapefile from 'shapefile';
import concat from 'concat-stream';
import yauzl from 'yauzl';
import path from 'path';
import fs from 'fs';
import srs from 'node-srs';
import uuid from 'uuid';
import {
  EventEmitter
}
from 'events';
import async from 'async';
import logger from '../util/logger';
import config from '../config';
import DevNull from '../util/devnull';
import {
  UninterpretableValue, CorruptShapefile, IncompleteArchive
}
from '../errors';

const DEFAULT_PROJECTION = '+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs';

function isHidden(parsedPath) {
  return parsedPath.name[0] === '.';
}

function isProjection(fileName) {
  var p = path.parse(fileName);
  return !isHidden(p) && p.ext === '.prj';
}

function isShp(fileName) {
  var p = path.parse(fileName);
  return !isHidden(p) && p.ext === '.shp';
}

function isDbf(fileName) {
  var p = path.parse(fileName);
  return !isHidden(p) && p.ext === '.dbf';
}

/**
 * When this is created it allocates a file for writing the zip
 *
 * Flow:
 * Someone pipes zip to This, when that finishes, emit 'finish' event
 * on 'finish' event, extract zip from fs
 * for each top level file in the zip, open a read stream and write
 *   to disk following shp naming convention - this step can be
 *   eliminated using the underlying shp library!
 * group the read streams into [.shp, .prj] tuples
 * for each of those, load the prj
 */
class Shapefile extends Duplex {

  constructor(disk) {
    super({
      objectMode: true,
      highWaterMark: config().rowBufferSize
    });

    //going to need this for creating the subfiles
    this._disk = disk;

    this._fgroup = uuid.v4();
    this._zName = this._fileGroup('.zip');
    //space on disk for us to buffer the entire zip archive
    //before extraction
    this._zBuffer = this._disk.allocate(this._zName, {
      defaultEncoding: 'binary'
    });

    //when the stream piped into this stream is finished,
    //finish will be emitted, and this stream will become readable
    this.on('finish', this._onFinished.bind(this));
    this._zBuffer.on('finish', this._onBuffered.bind(this));
  }

  static canDecode() {
    return ['application/zip', 'application/octet-stream'];
  }

  _fileGroup(extension, name) {
    name = name ? name.toLowerCase() : 'shapefile';
    return `/tmp/${name}_${this._fgroup}${extension}`;
  }

  _write(chunk, encoding, done) {
    return this._zBuffer.write(chunk, encoding, done);
  }


  _onFinished() {
    logger.debug(`Finished reading stream, closing underlying shapefile buffer`);
    this._zBuffer.end();
  }

  _onRecord(record, projection, readNext) {
    //filter out things that don't have a geometry
    if (!record.geometry) return readNext();

    //of course, sometimes instead of giving an empty list of coordinates,
    //the shapefile library gives 'null' coordinates, which doesn't
    //make any sense, but ok...
    if (!record.geometry.coordinates) record.geometry.coordinates = [];

    //;_:
    //hack because https://github.com/mbostock/shapefile/blob/b4470c9a3d121bd201ca0b458d1e97b0a4d3547f/index.js#L173
    //which turns things in to Multipolygons if they have rings ಠ_ಠ
    if (record.geometry.type === 'Polygon') {
      record.geometry.type = 'MultiPolygon';
      if (record.geometry.coordinates.length) {
        record.geometry.coordinates = [record.geometry.coordinates];
      }
    }

    if (!this.push(geoJsToSoQL(record, projection))) {
      //our reader has gone away, this kills the stream.
      //so end the stream with a null and flush anything
      //that's buffered into oblivion
      if (!this._readableState.pipes) {
        this.push(null);
        return this.pipe(new DevNull());
      }

      this._readableState.pipes.once('drain', readNext);
    } else {
      readNext();
    }
  }

  _emitFeatures(shapeFile, emitter, reader, projection) {
    var featureCount = 0;
    var readNext = () => {
      featureCount++;
      reader.readRecord((err, record) => {
        if (err) {
          var error = new UninterpretableValue({
            record: featureCount,
            filename: shapeFile
          });
          return emitter.emit('error', error);
        }
        if (record === shapefile.end) return emitter.emit('end');
        return emitter.emit('record', record);
      });
    };

    emitter.on('record', (record) => {
      this._onRecord(record, projection, readNext);
    });

    reader.readHeader((err, header) => {
      if (err) {
        var error = new CorruptShapefile({
          filename: shapeFile
        });
        return emitter.emit('error', error);
      }
      readNext();
    });
  }


  _shapeStream(shapeFile, reader, proj) {
    //the reader is closed automatically if an error occurrs
    var emitter = new EventEmitter();

    fs.stat(proj || '', (err, status) => {
      if (err && err.code === 'ENOENT') {
        logger.warn("Shapefile is missing a projection, going with the default");
        return this._emitFeatures(shapeFile, emitter, reader, DEFAULT_PROJECTION);
      }

      fs.readFile(proj, (projError, projection) => {
        if (projError) return emitter.emit('error', projError);
        projection = projection.toString('utf-8');

        return this._emitFeatures(shapeFile, emitter, reader, projection);
      });
    });
    return emitter;
  }

  _hasRequiredComponents(components) {
    var groups = this._groupComponents(components);
    return _.reduce(groups, (errors, [shp, _prj, dbf]) => {
      //if the shp or dbf are undefined, then record the error. prj
      //is technically optional
      if (!shp) {
        let error = new IncompleteArchive({
          missing: '.shp'
        });
        errors.push(error);
      }
      if (!dbf) {
        let error = new IncompleteArchive({
          missing: '.dbf'
        });
        errors.push(error);
      }
      return errors;
    }, []);
  }

  _groupComponents(components) {
    components.sort();
    var shps = components.filter((c) => isShp(c));
    var projs = components.filter((c) => isProjection(c));
    var dbfs = components.filter((c) => isDbf(c));

    logger.debug(`Shps ${shps}`);
    return _.zip(shps, projs, dbfs);
  }

  _startPushing() {
    this._isPushing = true;
    var groups = this._groupComponents(this._components);
    logger.debug(`Starting push of shapefile ${this._components} for ${groups.join(', ')}`);

    async.mapSeries(groups, ([shp, proj, _dbf], cb) => {
      logger.debug(`Building shapestream based on ${shp}`);
      this._shapeStream(shp, shapefile.reader(shp), proj)
        .on('error', (err) => {
          return cb(err);
        })
        .on('end', () => {
          return cb(false, false);
        });
    }, (err) => {
      if (err) return this.emit('error', err);
      this.push(null);
    });
  }

  _walk(onErr, onFile, onClose) {
    logger.debug("Shapefile buffered to disk");
    var extracted = [];
    yauzl.open(this._zName, (err, zipFile) => {
      if (err) return onErr(err);
      zipFile.on('entry', (entry) => {
          //We only want top level shape files
          if (path.dirname(entry.fileName).split(path.sep).length !== 1) return;
          onFile(entry, zipFile);
        })
        //this is a terrible hack. close gets called when the stream is closed, not when
        //it is flushed. fix would be to fork the yauzl library and make it emit close
        //when all readstreams that are opened with openReadStream emit 'finish'
        .on('close', () => setTimeout(onClose, 50))
        .on('error', onErr);
    });
  }

  /**
   * TODO: This has an extra copy, could be sped up probably
   */
  _onBuffered() {
    var extracted = [];
    this._walk(
      (err) => {
        this.emit('error', err);
      }, (entry, zipFile) => {
        zipFile.openReadStream(entry, (err, fstream) => {
          if (err) return this.emit('error', err);

          var ext = path.extname(entry.fileName);
          var basename = path.basename(entry.fileName, ext);
          var extractedName = this._fileGroup(ext, basename);
          var writeStream = this._disk.allocate(extractedName, {
            defaultEncoding: 'binary'
          });
          extracted.push(extractedName);
          return fstream.pipe(writeStream);
        });

      }, () => {
        this._components = extracted;

        logger.debug(`${this._components.join(', ')} are now readable`);
        var fileErrors = this._hasRequiredComponents(this._components);
        if (fileErrors.length) {
          this.emit('error', new IncompleteArchive({
              missing: fileErrors.map((err) => err.toJSON().missing).join(', ')
          }));
        } else {
          this.emit('readable');
        }
      });
  }

  summarize(cb) {
    var extracted = [];
    this._walk((err) => {
      cb(err);
    }, (entry, zipFile) => {
      if (isProjection(entry.fileName)) {
        zipFile.openReadStream(entry, (err, fstream) => {
          if (err) return this.emit('error', err);
          return fstream.pipe(concat((projection) => {
            extracted.push([entry.fileName, projection.toString('utf-8')]);
          }));
        });
      }
    }, () => {
      cb(false, extracted.map(([filename, projection]) => {
        logger.debug(`Projection: ${filename} ${projection}`);
        var proj = srs.parse(projection);
        return {
          count: 0,
          projection: proj.name,
          name: path.basename(filename, '.prj'),
          geometry: null,
          bbox: new BBox().toJSON(),
          columns: []
        };
      }));
    });
  }

  canSummarizeQuickly() {
    return true;
  }

  _read() {
    if (!this._readableState.emittedReadable && !this._isPushing) {
      this.once('readable', this._startPushing.bind(this));
    } else if (!this._isPushing) {
      this._startPushing();
    }
  }

}

export default Shapefile;