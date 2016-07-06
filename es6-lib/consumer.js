import Stomp from 'stomp-client';
import Spatial from './services/spatial';
import logger from './util/logger';
import ISS from './upstream/iss';

function consumer(config, zookeeper, metrics) {
  const hosts = config.amq.host
    .replace(/stomp:\/\//g, '')
    .split(',')
    .map(hostAndPort => hostAndPort.split(':'));

  const reconnectOpts = {
    retries: 3,
    delay: 500
  };

  hosts.forEach(([host, port]) => {
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
      new Spatial(zookeeper, amq, new ISS(amq));
    });

    amq.on('error', (reason) => {
      logger.error(`AMQ Disconnected, ${reason.message}`);
    });

  });
}

export
default consumer;