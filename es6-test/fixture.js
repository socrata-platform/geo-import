import fs from 'fs';

function fixture(name) {
  //ok, so in read streams, null === 'binary'
  return fs.createReadStream(__dirname + '/fixtures/' + name, {encoding: null});
}

function bufferJs(source, cb) {
  source.on('response', function(r) {
    var buffer = '';
    r.on('data', function(chunk) {
      buffer += chunk.toString('utf-8');
    })
    r.on('end', function() {

      var result;
      try {
        result = JSON.parse(buffer)
      } catch(e) {
        result = buffer
      }
      cb(r, result)
    })
  })
}

export {fixture as fixture, bufferJs as bufferJs};