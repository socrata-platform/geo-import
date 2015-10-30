import bodyParser from 'body-parser';
import express from 'express';
import router from './router';
import conf from './config';

function service(options, ready) {
  var config = conf();

  var zk = new options.zkClient(config);
  zk.once('connected', function() {

    var app = express();
    app.use(bodyParser.raw());
    router(config, app, zk);
    ready(app.listen(options.port));
  });
  zk.connect();
  return this;
}

export default service;