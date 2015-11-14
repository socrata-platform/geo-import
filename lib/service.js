import bodyParser from 'body-parser';
import express from 'express';
import router from './router';
import conf from './config';

import logger from './util/logger';


function service(zk, options, ready) {
  if(!zk) throw new Error('http service needs a zookeeper service');
  var config = conf();

  zk.once('connected', function() {
    var app = express();
    app.logger = logger;
    router(config, app, zk);

    logger.info(`Service started an listening on ${config.port}`)

    ready(app.listen(config.port), zk);
  });
  zk.connect();
  return this;
}

export default service;