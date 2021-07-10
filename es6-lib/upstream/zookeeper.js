import zookeeper from 'node-zookeeper-client';
import _ from 'underscore';
import ZKError from '../errors.js';
import path from 'path';
import { EventEmitter } from 'events';
import logger from '../util/logger.js';

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

    var aZookeeperNode = _.sample(this._conf.zk);
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
      if (err) return cb(new ZKError('Failed to get zookeeper children'));
      if (!children.length) return cb(new ZKError('No core nodes registered in zookeeper'));
      var chosen = children[Math.floor(Math.random() * children.length)];
      var instance = path.join(CORE_PATH, chosen);
      this._client.getData(instance, (err, buf) => {
        if (err) {
          return cb(new ZKError('Error getting data from zookeeper'));
        }
        let url;
        try {
          let entry = JSON.parse(buf.toString('utf-8'));
          //scheme isn't in the zk entry? what happens if we go ssl ¯\_(ツ)_/¯
          let scheme = 'http';
          url = `${scheme}://${entry.address}:${entry.port}`;
          logger.debug(`Core lives at ${url}`);
        } catch (err) {
          return cb(new ZKError('Zookeeper data was malformed'));
        }
        return cb(false, url);
      });
    });
  }

  getCore(cb) {
    logger.debug('Attempt to get core client');
    if (this._client.getState() === zookeeper.State.SYNC_CONNECTED) {
      return this._getCore(cb);
    } else {
      logger.warn(`State is currently ${this._client.getState()}, waiting for reconnect`);
      this._client.once('connected', () => this._getCore(cb));
    }
  }

  connect() {
    this._client.connect();
    return this;
  }
}

export default Zookeeper;
