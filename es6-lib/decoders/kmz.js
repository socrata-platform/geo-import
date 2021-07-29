import yauzl from 'yauzl';
import KML from './kml';
import uuid from 'uuid';
import fs from 'fs';
import path from 'path';
import es from 'event-stream';
import { Duplex } from 'stream';
import logger from '../util/logger';
import config from '../config';
import DevNull from '../util/devnull';
import { ArchiveError } from '../errors';


/**
 * ZIP archives are dumb in that their directory structure
 * is stored in a footer, so we have to unzip it onto disk
 * and then pipe it through the KML transform UGH
 */
class KMZ extends Duplex {

  constructor(disk) {
    super({
      objectMode: true,
      highWaterMark: config().rowBufferSize
    });

    this._zName = '/tmp/kmz_' + uuid.v4() + '.zip';
    this._zBuffer = disk.allocate(this._zName, {
      defaultEncoding: 'binary'
    });

    this.on('finish', this._onFinished.bind(this));
    this._zBuffer.on('finish', this._onBuffered.bind(this));
  }

  static canDecode() {
    return ['application/vnd.google-earth.kmz'];
  }
  static canDecodeExtensions() {
    return ['.kmz'];
  }

  _write(chunk, encoding, done) {
    return this._zBuffer.write(chunk, null, done);
  }

  _onFinished() {
    logger.debug('Finished reading stream, closing underlying kmz buffer');
    this._zBuffer.end();
  }

  _onBuffered() {
    this.emit('readable');
  }

  _onOpenKmlStream(kmlStream) {
    return kmlStream
      .pipe(new KML())
      .on('error', (err) => this.emit('error', err))
      .on('data', (data) => {
        if (this._readableState.ended) return;
        if (!this.push(data)) {

          //our reader has gone away, this kills the stream.
          //so end the stream with a null and flush anything
          //that's buffered into oblivion
          if (!this._readableState.pipes) {
            this.push(null);
            return this.pipe(new DevNull());
          }

          if (!kmlStream.isPaused()) {
            this._readableState.pipes.once('drain', () => {
              kmlStream.resume();
            });
            kmlStream.pause();
          }
        }
      });
  }

  _startPushing() {
    this._isPushing = true;
    var hasOpened = false;

    yauzl.open(this._zName, {
      lazyEntries: true
    }, (err, zipFile) => {

      if (err) return this.emit('error', new ArchiveError(err.toString()));

      zipFile
        .on('error', (err) => {
          this.emit('error', new ArchiveError(err.toString()));
        })
        .on('entry', (entry) => {
          logger.info(`Checking KMZ entry ${entry.fileName}`);
          if (path.extname(entry.fileName) !== '.kml') return zipFile.readEntry();

          zipFile.openReadStream(entry, (err, kmlStream) => {
            if (err) return this.emit('error', err);
            logger.info(`Extracting kml ${entry.fileName} from kmz archive`);

            this._onOpenKmlStream(kmlStream)
              .on('end', () => zipFile.readEntry());
          });
        })
        .once('end', () => {
          this.push(null);
          logger.info('Done reading KMZ archive');
        });

      zipFile.readEntry();
    });
  }

  //just cuz
  _read() {
    if (!this._readableState.emittedReadable && !this._isPushing) {
      this.once('readable', this._startPushing.bind(this));
    } else if (!this._isPushing) {
      this._startPushing();
    }
  }

  summarize(cb) {
    return (new KML()).summarize(cb);
  }

  canSummarizeQuickly() {
    return false;
  }
}

export default KMZ;
