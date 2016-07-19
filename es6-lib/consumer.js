import Stomp from 'stomp-client';
import Spatial from './services/spatial';
import logger from './util/logger';
import async from 'async';
import _ from 'underscore';

function consumer(config, zookeeper, metrics, onStarted) {
  const hosts = config.amq.host
    .replace(/stomp:\/\//g, '')
    .split(',')
    .map(hostAndPort => hostAndPort.split(':'));

  const reconnectOpts = {
    retries: config.amq.reconnectAttempts,
    delay: config.amq.reconnectDelayMs
  };

  var thunks = hosts.map(([host, port]) => {
    return (cb) => {
      logger.info(`Attempting to connect to stomp://${host}:${port}`);
      var amq = new Stomp(
        host,
        port,
        config.amq.user,
        config.amq.pass,
        "1.0",
        null,
        reconnectOpts
      );
      amq.connect((sessionId) => {
        logger.info(`Connected to amq with ${sessionId}`);
        const spatialConsumer = new Spatial(zookeeper, amq);
        cb(null, spatialConsumer);
      });

      amq.on('reconnecting', () => {
        logger.warn('Attempting to reconnect to AMQ');
      });
      amq.on('reconnect', (sessionId) => {
        logger.warn(`AMQ reconnected ${sessionId}`);
      });
      amq.on('error', (reason) => {
        logger.error(`AMQ Disconnected, ${reason.message}`);
        logger.error(`Reached ${config.amq.reconnectAttempts} reconnect attempts. Going to exit. Maybe it will be brought back up and AMQ will be available.`);
        process.exit();
      });
    };
  });

  async.parallel(thunks, (_err, closeables) => {
    onStarted(closeables);
  });
}

export
default consumer;