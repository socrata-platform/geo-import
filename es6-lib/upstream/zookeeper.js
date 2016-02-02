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
    if (!this._conf) throw new Error('Zookeeper argument error!');
    this._init();
  }

  _init() {
    logger.info('Initializing zookeeper client');
    if (this._client) this._client.close();

    var [aZookeeperNode] = this._conf.zk;
    this._client = zookeeper.createClient(aZookeeperNode);

    //proxy the underlying events onto this emitter
    var events = ['connected', 'connectedReadOnly', 'disconnected', 'expired', 'authenticationFailed'];
    events.forEach((ev) => {
      this._client.on(ev, _.partial(this.emit, ev).bind(this));
      this.on(ev, _.partial(this._logEvent, ev).bind(this));
    });

    this._client.on('expired', this._onExpired.bind(this));
  }

  _logEvent(ev) {
    logger.info(`zookeeper client event: ${ev}`);
  }

  _onExpired() {
    logger.warn('Zookeeper disconnected! Retrying...');
    this._init();
    this.connect();
  }


  _getCore(cb) {
    this._client.getChildren(CORE_PATH, (err, children) => {
      if (err) {
        var zkError = new BadResponseFromServer({
          message: err.toString()
        });
        return cb(zkError);
      }
      if (!children.length) {
        let nameError = new BadResponseFromServer({
          message: 'No core nodes registered in zookeeper'
        });
        return cb(nameError);
      }
      var chosen = children[Math.floor(Math.random() * children.length)];
      var instance = path.join(CORE_PATH, chosen);
      this._client.getData(instance, (err, buf) => {
        if (err) return cb(err);
        try {
          let entry = JSON.parse(buf.toString('utf-8'));
          //scheme isn't in the zk entry? what happens if we go ssl ¯\_(ツ)_/¯
          let scheme = 'http';
          let url = `${scheme}://${entry.address}:${entry.port}`;
          logger.debug(`Core lives at ${url}`);
          return cb(false, url);
        } catch (err) {
          let zkEntryError = new BadResponseFromServer({
            message: 'Zookeeper state is not parseable'
          });
          return cb(zkEntryError);
        }
      });
    });
  }

  getCore(cb) {
    logger.debug('Attempt to get core client');
    if (this._client.getState() === zookeeper.State.SYNC_CONNECTED) {
      return this._getCore(cb);
    } else {
      logger.warn(`State is currently ${this._client.getState()}, waiting for reconnect`);
      this._client.once('connected', () => {
        this._getCore(cb);
      });
    }
  }

  connect() {
    this._client.connect();
    return this;
  }
}

export default Zookeeper;