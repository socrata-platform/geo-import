import stompit from 'stompit';
import Spatial from './services/spatial';
import logger from './util/logger';
import async from 'async';
import _ from 'underscore';
import EventEmitter from 'events';
import conf from './config';

const config = conf();

class QueueManager extends EventEmitter {

  constructor() {
    super();
    this._underlying = [];
  }

  connect(host, port) {
    var reconnectAttempts = 0;
    var attemptReconnect = () => {
      reconnectAttempts++;
      if (reconnectAttempts < config.amq.reconnectAttempts) {
        setTimeout(() => this.connect(host, port), config.amq.reconnectDelayMs);

      } else {
        logger.error(`Reached ${config.amq.reconnectAttempts}, giving up...`);
        // process.exit();
      }
    };

    logger.info(`Attempting to connect to stomp://${host}:${port} ${reconnectAttempts} / ${config.amq.reconnectAttempts}`);
    stompit.connect({
      host,
      port,
      connectHeaders: {
        host: '/',
        login: config.amq.user,
        passcode: config.amq.pass,
        'heart-beat': `${config.amq.heartbeat},${config.amq.heartbeat}`
      }
    }, (error, amq) => {
      if (error) {
        logger.error(`Failed to connect to amq ${error}`);
        return attemptReconnect();
      }

      reconnectAttempts = 0;
      logger.info(`Connected to stomp://${host}:${port}`);


      amq.once('error', (e) => {
        this._underlying = _.without(this._underlying, amq);
        logger.error(e);
        attemptReconnect();
      });

      this._underlying.push(amq);

      let headers = {
        'destination': config.amq.inName
      };
      amq.subscribe(headers, (error, message) => {
        if (error) {
          return logger.error(`Failed to subscribe to ${config.amq.inName}`);
        }

        message.readString('utf-8', (error, body) => {
          if (error) {
            return logger.error(`Failed to read message ${message}`);
          }

          this.emit('message', body);
        });
      });
      this.emit('connected', amq);
    });
  }

  send(message) {
    // need to write to both activity-feed and ISS queues since
    // ISS is scheduled for deprecation and no longer tells
    // activity-feed when geo-imports are completed.
    const doSend = (amq) => {
      config.amq.outNames.forEach(sendToQueue);

      function sendToQueue(queue) {
        var received = false;
        let headers = {
          'persistent': true,
          'suppress-content-length': true,
          'destination': queue
        };
        let frame = amq.send(headers, {
          onReceipt: () => {
            logger.info(`Receipt of ${message} confirmed`);
            received = true;
          }
        });
        frame.write(message);
        frame.end();
        setTimeout(() => {
          if (!received) {
            logger.error(`Never got receipt for message: ${message}`);
          }
        }, 3000);
      }
    };

    const amq = _.sample(this._underlying);

    if(!amq) {
      return this.once('connected', doSend);
    }

    doSend(amq);
  }

  subscribe(callback) {
    this.on('message', callback);
  }

  disconnect() {
    this._underlying.forEach((amq) => amq.disconnect());
  }
}


function consumer(zookeeper, metrics) {
  const hosts = config.amq.host
    .replace(/stomp:\/\//g, '')
    .split(',')
    .map(hostAndPort => hostAndPort.split(':'));

  const manager = new QueueManager();
  const spatialConsumer = new Spatial(zookeeper, manager);

  hosts.forEach(([host, port]) => {
    manager.connect(host, port);
  });

  return spatialConsumer;
}

export
default consumer;
