'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _bodyParser = require('body-parser');

var _bodyParser2 = _interopRequireDefault(_bodyParser);

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _router = require('./router');

var _router2 = _interopRequireDefault(_router);

var _config = require('./config');

var _config2 = _interopRequireDefault(_config);

var _utilLogger = require('./util/logger');

var _utilLogger2 = _interopRequireDefault(_utilLogger);

function service(zk, options, ready) {
  if (!zk) throw new Error('http service needs a zookeeper service');
  var config = (0, _config2['default'])();

  zk.once('connected', function () {
    var app = (0, _express2['default'])();
    app.logger = _utilLogger2['default'];
    (0, _router2['default'])(config, app, zk);
    _utilLogger2['default'].info('Service started an listening on ' + config.port);

    app = app.listen(config.port).on('connection', function (socket) {
      socket.setTimeout(config.socketTimeoutMs);
    });
    ready(app, zk);
  });
  zk.connect();
  return this;
}

exports['default'] = service;
module.exports = exports['default'];