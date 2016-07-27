import _ from 'underscore';
import {
  Transform
}
from 'stream';
import config from '../config';

class LDJson extends Transform {

  constructor(columns) {
    super({
      writableObjectMode: false,
      readableObjectMode: true,
      highWaterMark: config().rowBufferSize
    });
    this._buf = '';
  }

  _push(token) {
    try {
      this.push(JSON.parse(token));
    } catch(e) {

    }
  }

  _transform(buf, _encoding, done) {
    //_buf = a0
    //tokens = [a1, b0, c0]
    var tokens = buf.toString('utf-8').split('\n');
    //rest = c0
    //tokens  = [a0, b0]
    var rest = tokens.pop();

    if(tokens.length >= 1) {
      var token = this._buf + tokens.shift();
      this._push(token);
      //tokens = [b0]
    } else {
      rest = this._buf + rest;
    }

    tokens.forEach(this._push.bind(this));

    this._buf = rest;

    done();
  }

  _flush(done) {
    this._push(this._buf);
    done();
  }
}

export default LDJson;