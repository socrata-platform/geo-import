import bodyParser from 'body-parser';
import express from 'express';
import router from './router';
import consumer from './consumer';
import conf from './config';
import logger from './util/logger';
import Metrics from './util/metrics';

function service(zk, options, ready) {
  if (!zk) throw new Error('http service needs a zookeeper service');
  var config = conf();

  zk.once('connected', function() {
    var app = express();
    var metrics = new Metrics(config);
    app.logger = logger;

    router(app, zk, metrics);
    logger.info(`Service started an listening on ${config.port}`);
    consumer(config, zk, metrics);

    app = app
      .listen(config.port)
      .on('connection', (socket) => {
        socket.setTimeout(config.socketTimeoutMs);
      });
    app.metrics = metrics;
    ready(app, zk);
  });
  zk.connect();
  return this;
}

export
default service;