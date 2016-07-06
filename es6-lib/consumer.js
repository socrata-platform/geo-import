import Stomp from 'stomp-client';
import Spatial from './services/spatial';
import logger from './util/logger';
import ISS from './upstream/iss';
import async from 'async';
import _ from 'underscore';

function consumer(config, zookeeper, metrics, onStarted) {
  const hosts = config.amq.host
    .replace(/stomp:\/\//g, '')
    .split(',')
    .map(hostAndPort => hostAndPort.split(':'));

  const reconnectOpts = {
    retries: 3,
    delay: 500
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
        const spatialConsumer = new Spatial(zookeeper, amq, new ISS(amq));

        cb(null, spatialConsumer);
      });

      amq.on('error', (reason) => {
        logger.error(`AMQ Disconnected, ${reason.message}`);
      });
    };
  });

  async.parallel(thunks, (_err, closeables) => {
    onStarted(closeables);
  });
}

export
default consumer;