'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

function fixture(name) {
  //ok, so in read streams, null === 'binary'
  return _fs2['default'].createReadStream(__dirname + '/fixtures/' + name, { encoding: null });
}

function bufferJs(source, cb) {
  source.on('response', function (r) {
    var buffer = '';
    r.on('data', function (chunk) {
      buffer += chunk.toString('utf-8');
    });
    r.on('end', function () {

      var result;
      try {
        result = JSON.parse(buffer);
      } catch (e) {
        result = buffer;
      }
      cb(r, result);
    });
  });
}

exports.fixture = fixture;
exports.bufferJs = bufferJs;