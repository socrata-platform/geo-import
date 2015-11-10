import yauzl from 'yauzl';
import KML from './kml';
import through from 'through';
import uuid from 'uuid';
import fs from 'fs';
import es from 'event-stream';
import {
  Duplex
}
from 'stream';

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

    this._zBuffer.on('finish', this._onBuffered.bind(this));
    this._kml = new KML();
  }

  static canDecode() {
    return ['application/vnd.google-earth.kmz', 'application/octet-stream']
  }

  write(chunk, encoding, done) {
    return this._zBuffer.write(chunk, 'binary', done);
  }

  end() {
    this._zBuffer.end();
  }

  _onBuffered() {
    yauzl.open(this._zName, (err, zipFile) => {
      if (err) return this.emit('error', err);
      zipFile
        .on('error', (err) => {
          this.emit('error', err);
        }.bind(this))
        .on('entry', (entry) => {
          zipFile.openReadStream(entry, (err, kmlStream) => {
            if (err) return this.emit('error', err);
            this._underlying = kmlStream;
            kmlStream
              .pipe(new KML())
              .on('error', (err) => {
                this.emit('error', err);
              }.bind(this))
              .on('data', (data) => {
                this.push(data);
              }.bind(this))
              .on('end', () => {
                if (zipFile.entriesRead === zipFile.entryCount) {
                  this.emit('end');
                }
              }.bind(this));
          }.bind(this));
        }.bind(this));
    }.bind(this));
  }

  //just cuz
  _read() {}
}

export default KMZ;