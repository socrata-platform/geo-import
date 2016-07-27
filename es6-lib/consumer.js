import stompit from 'stompit';
import Spatial from './services/spatial';
import logger from './util/logger';
import async from 'async';
import _ from 'underscore';
import EventEmitter from 'events';

function consumer(config, zookeeper, metrics, onStarted) {
  const hosts = config.amq.host
    .replace(/stomp:\/\//g, '')
    .split(',')
    .map(hostAndPort => hostAndPort.split(':'));

  const reconnectOpts = {
    retries: config.amq.reconnectAttempts,
    delay: config.amq.reconnectDelayMs
  };


  const amqInterface = (amq) => {
    let send = (message) => {
      let headers = {
        'persistent': true,
        'suppress-content-length': true,
        'destination': config.amq.outName
      };
      let frame = amq.send(headers);
      frame.write(message);
      frame.end();
    };

    let subscribe = (callback) => {
      let headers = {
        'destination': config.amq.inName
      };
      amq.subscribe(headers, (error, message) => {
        if(error) {
          return logger.error(`Failed to subscribe to ${config.amq.inName}`);
        }

        message.readString('utf-8', (error, body) => {
          if(error) {
            return logger.error(`Failed to read message ${message}`);
          }

          callback(body);
        });
      });
    };

    let disconnect = () => {
      amq.disconnect();
    };

    return {send, subscribe, disconnect};
  };

  const ee = new EventEmitter();
  hosts.forEach(([host, port]) => {
    var reconnectAttempts = 0;

    var attemptReconnect = () => {
      reconnectAttempts++;
      if(reconnectAttempts < config.amq.reconnectAttempts) {
        setTimeout(connect, config.amq.reconnectDelayMs);
      } else {
        logger.error(`Reached ${config.amq.reconnectAttempts}, exiting...`);
        process.exit();
      }
    };

    var connect = () => {
      logger.info(`Attempting to connect to stomp://${host}:${port} ${reconnectAttempts} / ${config.amq.reconnectAttempts}`);
      stompit.connect({
        host,
        port,
        connectHeaders : {
          host: '/',
          login: config.amq.user,
          passcode: config.amq.pass,
          'heart-beat': '5000,5000'
        }
      }, (error, amq) => {
        if(error) {
          logger.error(`Failed to connect to amq ${error}`);
          return attemptReconnect();
        }

        reconnectAttempts = 0;
        logger.info(`Connected to stomp://${host}:${port}`);


        const spatialConsumer = new Spatial(zookeeper, amqInterface(amq));

        amq.once('error', () => {
          ee.emit('remove', spatialConsumer);
          attemptReconnect();
        });

        ee.emit('append', spatialConsumer);
      });
    };

    connect();
  });

  return ee;
}

export
default consumer;