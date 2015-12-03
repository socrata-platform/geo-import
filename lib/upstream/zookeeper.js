import zookeeper from 'node-zookeeper-client';
import _ from 'underscore';
import util from 'util';
import path from 'path';
import {
  EventEmitter
}
from 'events';
import logger from '../util/logger';

const CORE_PATH = '/com.socrata/soda/services/core';

class Zookeeper extends EventEmitter {
  constructor(conf) {
    super();
    this._conf = conf;
    if(!this._conf) throw new Error("Zookeeper argument error!");
    var [aZookeeperNode] = this._conf.zk;

    this._client = zookeeper.createClient(aZookeeperNode);

    //proxy the underlying events onto this emitter
    var events = ['connected', 'connectedReadOnly', 'disconnected', 'expired', 'authenticationFailed'];
    events.forEach((ev) => {
      this._client.on(ev, _.partial(this.emit, ev).bind(this));
      this.on(ev, _.partial(this._logEvent, ev).bind(this));
    });
  }

  _logEvent(ev) {
    logger.info(`zookeeper client event: ${ev}`);
  }


  getCore(cb) {
    this._client.getChildren(CORE_PATH, (err, children) => {
      if(err) return cb(err);
      if(!children.length) return cb({
        statusCode: 502,
        body: "No core nodes registered in zookeeper"
      });
      var chosen = children[Math.floor(Math.random() * children.length)];
      var instance = path.join(CORE_PATH, chosen);
      this._client.getData(instance, (err, buf) => {
        if(err) return cb(err);
        try {
          let entry = JSON.parse(buf.toString('utf-8'));
          //scheme isn't in the zk entry? what happens if we go ssl ¯\_(ツ)_/¯
          let scheme = 'http';
          let url = `${scheme}://${entry.address}:${entry.port}`;
          return cb(false, url);
        } catch(err) {
          return cb(err);
        }
      });
    });
  }

  connect() {
    this._client.connect();
    return this;
  }
}

export default Zookeeper;
