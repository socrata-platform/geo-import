import {EventEmitter} from 'events';


class MockZKClient extends EventEmitter {
  constructor() {
    super();
  }

  enableErrors() {
    this._broken = true;
  }

  disableErrors(){
    this._broken = false;
  }

  get corePort() {
    if(this._port) return this._port;
    var min = 10020;
    var max = 10080;
    this._port = Math.floor(Math.random() * (max - min + 1)) + min;
    return this._port;
  }

  _err(message) {
    return {
      statusCode: 503,
      body: message
    };
  }

  getCore(cb) {
    if(!this._isConnected) return cb("zk not yet connected");
    if(this._broken) return cb(this._err("zk connection is dead"));
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