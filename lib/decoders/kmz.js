import yauzl from 'yauzl';
import KML from './kml';
import through from 'through';
import uuid from 'uuid';
import fs from 'fs';
import path from 'path';
import es from 'event-stream';
import {
  Duplex
}
from 'stream';
import logger from '../util/logger';


/**
 * ZIP archives are dumb in that their directory structure
 * is stored in a footer, so we have to unzip it onto disk
 * and then pipe it through the KML transform UGH
 */
class KMZ extends Duplex {

  constructor(disk) {
    super({
      objectMode: true
    });

    this._zName = '/tmp/kmz_' + uuid.v4() + '.zip';
    this._zBuffer = disk.allocate(this._zName, {
      defaultEncoding: 'binary'
    });

    this.on('finish', this._onFinished.bind(this));
    this._zBuffer.on('finish', this._onBuffered.bind(this));
    this._kml = new KML();
  }

  static canDecode() {
    return ['application/vnd.google-earth.kmz'];
  }

  _write(chunk, encoding, done) {
    logger.debug('Writing kmz chunk');
    return this._zBuffer.write(chunk, null, done);
  }

  _onFinished() {
    logger.debug('Finished reading stream, closing underlying kmz buffer');
    this._zBuffer.end();
  }

  _onBuffered() {
    yauzl.open(this._zName, (err, zipFile) => {
      if (err) return this.emit('error', err);
      zipFile
        .on('error', (err) => {
          this.emit('error', err);
        })
        .on('entry', (entry) => {
          if(path.extname(entry.fileName) !== '.kml') return;

          zipFile.openReadStream(entry, (err, kmlStream) => {
            if (err) return this.emit('error', err);
            this._underlying = kmlStream;
            logger.info(`Extracting kml ${entry.fileName} from kmz archive`);
            kmlStream
              .pipe(this._kml)
              .on('error', (err) => {
                this.emit('error', err);
              })
              .on('data', (data) => {
                this.push(data);
              })
              .on('end', () => {
                if (zipFile.entriesRead === zipFile.entryCount) {
                  this.emit('end');
                }
              });
          });
        });
    });
  }

  //just cuz
  _read() {}

  summarize(cb) {
    return this._kml.summarize(cb);
  }

  canSummarizeQuickly() {
    return false;
  }
}

export default KMZ;