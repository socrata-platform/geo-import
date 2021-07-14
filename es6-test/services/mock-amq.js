import EventEmitter from 'events';
import config from '../../lib/config/index.js';
const conf = config();

class AmqMock extends EventEmitter {
  // yes, it is known - core server seriously serializes JSON three times nested
  // inside the object, so you get to parse it three times!
  messageFor(kind, parentFourFour, filename, script, host, token, cookie, reqId) {
    const auth = JSON.stringify({
      auth: JSON.stringify({
        host,
        token,
        cookie,
        reqId,
        filename,
        replace: false
      })
    });

    return JSON.stringify({
      "source": `x-socrata-blob:${filename}`,
      "file-type": auth,
      "skip": 0,
      "id": "e7b813c8-d68e-4c8a-b1bc-61c709816fc3",
      "filename": filename,
      "script": {
        layers: script
      },
      "type": kind,
      "user": "kacw-u8uj",
      "view": parentFourFour
    });
  }

  importFixture(fixtureName, layerNames, fourfour) {
    this.emit(conf.amq.inName, this.messageFor(
      'import',
      fourfour || 'ffff-ffff',
      fixtureName,
      layerNames.map((name) => ({
        name
      })),
      'localhost',
      'app-token',
      'cookie',
      'req-id'
    ));
  }

  replaceFixture(fixtureName, script) {
    this.emit(conf.amq.inName, this.messageFor(
      'replace',
      'ffff-ffff',
      fixtureName,
      script,
      'localhost',
      'app-token',
      'cookie',
      'req-id'
    ));
  }

  subscribe(onMessage) {
    this.on(conf.amq.inName, onMessage);
  }

  send(message) {
    conf.amq.outNames.forEach(n => this.emit(n, message));
  }

}

export default AmqMock;
