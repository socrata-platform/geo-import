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

  var hostIndex = 0;

  const connect = () => {
    const [host, port] = hosts[hostIndex % hosts.length];

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

    hostIndex++;

    amq.on('error', (reason) => {
      logger.error(`AMQ Disconnected, ${reason.message}`);

      // When the underlying library gives up on reconnects, it
      // will have a reconnectionFailed attribute in the error
      // https://github.com/easternbloc/node-stomp-client#event-error
      if (reason.reconnectionFailed) {
        connect();
      }
    });
  };
  connect();

}

export
default consumer;