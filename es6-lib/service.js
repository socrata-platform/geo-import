import bodyParser from 'body-parser';
import express from 'express';
import router from './router';
import consumer from './consumer';
import conf from './config';
import logger from './util/logger';
import Metrics from './util/metrics';
import async from 'async';

function service(zk, options, ready) {
  if (!zk) throw new Error('http service needs a zookeeper service');
  var config = conf();
  var closeables = [];

  zk.once('connected', function() {
    var app = express();
    var metrics = new Metrics(config);
    app.logger = logger;

    router(app, zk, metrics);
    logger.info(`Service started an listening on ${config.port}`);


    consumer(config, zk, metrics, (consumers) => {
      closeables = closeables.concat(consumers);
    });

    app = app
      .listen(config.port)
      .on('connection', (socket) => {
        socket.setTimeout(config.socketTimeoutMs);
      });
    app.metrics = metrics;
    closeables.push(app);
    ready(app, zk);
  });
  zk.connect();


  const onExit = () => {
    logger.warn(`Got a SIG, shutting down...`);
    async.parallel(closeables.map(c => c.close.bind(c)), (err) => {
      logger.info("Adios...");
      process.exit();
    });
  };

  process.on('SIGTERM', onExit);
  process.on('SIGINT', onExit);
  return this;
}

export
default service;