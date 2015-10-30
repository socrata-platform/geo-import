import zookeeper from 'node-zookeeper-client';
import util from 'util';
import {EventEmitter} from 'events';

class Zookeeper extends EventEmitter {
  constructor(conf) {
    super();
    this._conf = conf;

    var zkPort = this._conf.zk.port;
    var zkHost = this._conf.zk.host;

    this._client = zookeeper.createClient(`${zkHost}:${zkPort}`);
  }


  getCore(cb) {
    throw new Error("not implemented");
  }
}

export default Zookeeper;