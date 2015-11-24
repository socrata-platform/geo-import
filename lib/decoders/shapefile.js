/**
 * Convert a shapefile into SoQL Values
 */
import JSONStream from 'JSONStream';
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
import shapefile from 'shapefile';
import yauzl from 'yauzl';
import path from 'path';
import fs from 'fs';
import uuid from 'uuid';
import {
  EventEmitter
}
from 'events';
import async from 'async';
import logger from '../util/logger';

const DEFAULT_PROJECTION = '+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs';

class Shapefile extends Duplex {

  constructor(disk) {
    super({
      objectMode: true
    });

    //going to need this for creating the subfiles
    this._disk = disk;

    this._fgroup = uuid.v4();
    this._zName = this._fileGroup('.zip');
    this._zBuffer = this._disk.allocate(this._zName, {
      defaultEncoding: 'binary'
    });

    this.on('finish', this._onFinished.bind(this));
    this._zBuffer.on('finish', this._onBuffered.bind(this));
  }

  static canDecode() {
    return ['application/zip', 'application/octet-stream'];
  }

  _fileGroup(extension, name) {
    name = name || 'shapefile';
    return `/tmp/${name}_${this._fgroup}${extension}`;
  }

  _write(chunk, encoding, done) {
    logger.debug(`Writing shape feature chunk`);
    return this._zBuffer.write(chunk, encoding, done);
  }


  _onFinished() {
    logger.debug(`Finished reading stream, closing underlying shapefile buffer`);
    this._zBuffer.end();
  }

  _onRecord(record, projection) {
    //;_:
    //hack because https://github.com/mbostock/shapefile/blob/b4470c9a3d121bd201ca0b458d1e97b0a4d3547f/index.js#L173
    //which turns things in to Multipolygons if they have rings ಠ_ಠ
    if(record.geometry.type === 'Polygon') {
      record.geometry.type = 'MultiPolygon';
      record.geometry.coordinates = [record.geometry.coordinates];
    }

    this.push(geoJsToSoQL(record, projection));
  }

  _emitFeatures(emitter, reader, projection) {
    var readNext = () => {
      reader.readRecord((err, record) => {
        if (err) return emitter.emit('error', new Error(`Failed to read feature ${err}`));
        if (record === shapefile.end) return emitter.emit('end');
        return emitter.emit('record', record);
      });
    };

    emitter.on('record', (record) => {
      logger.debug(`found shape record`);
      this._onRecord(record, projection);
      readNext();
    });

    reader.readHeader((err, header) => {
      if (err) return emitter.emit('error', new Error(`Failed to read shapefile header ${err}`));
      readNext();
    });
  }

  _readShp(reader, proj) {
    //the reader is closed automatically if an error occurrs
    var emitter = new EventEmitter();

    fs.stat(proj || '', (err, status) => {
      if (err && err.code === 'ENOENT') {
        logger.info("Shapefile is missing a projection, going with the default");
        return this._emitFeatures(emitter, reader, DEFAULT_PROJECTION);
      }

      fs.readFile(proj, (projError, projection) => {
        if (projError) return emitter.emit('error', projError);
        projection = projection.toString('utf-8');

        return this._emitFeatures(emitter, reader, projection);
      });
    });
    return emitter;
  }

  _onShapefile(components, onEnd) {
    components.sort();
    var shps = components.filter((c) => path.extname(c) === '.shp');
    var projs = components.filter((c) => path.extname(c) === '.prj');
    async.map(_.zip(shps, projs), ([shp, proj], cb) => {
      this._readShp(shapefile.reader(shp), proj)
        .on('error', (err) => {
          return cb(err);
        })
        .on('end', () => {
          return cb(false, false);
        });
    }, onEnd);
  }

  _onBuffered() {
    logger.debug("Shapefile buffered to disk");
    var extracted = [];
    yauzl.open(this._zName, (err, zipFile) => {
      if (err) return this.emit('error', err);
      zipFile.on('entry', (entry) => {
          //We only want top level shape files
          if(path.dirname(entry.fileName).split(path.sep).length !== 1) return;

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
        })
        .on('close', () => {
          logger.info(`Extraced shapefile files ${extracted.join(', ')}`);
          this._onShapefile(extracted, (err) => {
            if (err) return this.emit('error', err);
            this.emit('end');
          });
        })
        .on('error', (err) => {
          this.emit('error', err);
        });

    });
  }

  //just cuz
  _read() {}
}

export default Shapefile;