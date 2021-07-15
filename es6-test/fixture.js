import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const fileName = fileURLToPath(import.meta.url);
const dirName = path.dirname(fileName);

function fixture(name) {
  //ok, so in read streams, null === 'binary'
  return fs.createReadStream(dirName + '/fixtures/' + name, {encoding: null});
}

function bufferJs(source, cb) {
  source.on('response', function(r) {
    var buffer = '';
    r.on('data', function(chunk) {
      buffer += chunk.toString('utf-8');
    });
    r.on('end', function() {

      var result;
      try {
        result = JSON.parse(buffer);
      } catch(e) {
        result = buffer;
      }
      cb(r, result);
    });
  });
}

export { fixture as fixture, bufferJs as bufferJs };