import {EventEmitter} from 'events';


class MockZKClient extends EventEmitter {
  constructor() {
    super();
  }

  get corePort() {
    return 6668
  }

  getCore(cb) {
    if(!this._isConnected) return cb("zk core called before connected");
    return cb(false, `http://localhost:${this.corePort}`);
  }

  connect() {
    setTimeout(function() {
      this._isConnected = true;
      this.emit('connected');
    }.bind(this), 20);

  }
}



export default MockZKClient;