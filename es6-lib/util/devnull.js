import { Duplex } from 'stream';

class DevNull extends Duplex {
  constructor() {
    super({
      objectMode: true
    });
  }

  _write(chunk, enc, cb) {
    this.push(null);
    setImmediate(cb);
  }

  _read() {

  }
}

export default DevNull;
