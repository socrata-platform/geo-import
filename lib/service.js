import bodyParser from 'body-parser';
import express from 'express';
import router from './router';
import conf from './config';

import logger from './util/logger';


function service(options, ready) {
  var config = conf();

  var zk = new options.zkClient(config);
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