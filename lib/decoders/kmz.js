import yauzl from 'yauzl';
import KML from './kml';
import through from 'through';
import uuid from 'uuid';
import fs from 'fs';

class KMZ {
  toFeatures(stream) {
    console.log("Write")
    var zName = '/tmp/kmz_' + uuid.v4() + '.zip';
    var zBuffer = fs.createWriteStream(zName, {
      defaultEncoding: 'binary'
    });

    var kml = new KML();
    var out = through((chunk) => {}, () => out.queue(null));

    //pyramid of
    //d
    //  o
    //    o
    //      o
    //    o
    //  o
    //m
    stream.pipe(zBuffer).on('finish', () => {
      yauzl.open(zName, (err, zipFile) => {
        if (err) return out.emit('error', err);
        zipFile.on('entry', (entry) => {
          console.log("found", entry.fileName);
          zipFile.openReadStream(entry, (err, kmlStream) => {
            if(err) return out.emit('error', err);
            console.log(kmlStream)
            kml.toFeatures(kmlStream).pipe(out);
          });
        });
      });
    });

    return out;
  }
}

export default KMZ;