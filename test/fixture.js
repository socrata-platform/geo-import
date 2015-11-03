import fs from 'fs';

function fixture(name) {
  return fs.createReadStream(__dirname + '/fixtures/' + name, {encoding: 'utf8'});
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