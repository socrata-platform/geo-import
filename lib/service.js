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

    var port = options.port || config.port;
    logger.info(`Service started an listening on ${port}`)

    console.log("SERVICE BINDING TO PORT", port)
    ready(app.listen(port), zk);
  });
  zk.connect();
  return this;
}

export default service;