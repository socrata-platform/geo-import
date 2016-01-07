/**
 * Not much to see here. Just some routes.
 */
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _servicesVersion = require('./services/version');

var _servicesVersion2 = _interopRequireDefault(_servicesVersion);

var _servicesSpatial = require('./services/spatial');

var _servicesSpatial2 = _interopRequireDefault(_servicesSpatial);

var _servicesSummary = require('./services/summary');

var _servicesSummary2 = _interopRequireDefault(_servicesSummary);

var _utilMetrics = require('./util/metrics');

var _utilMetrics2 = _interopRequireDefault(_utilMetrics);

var _utilLogger = require('./util/logger');

var _utilLogger2 = _interopRequireDefault(_utilLogger);

function js(req, res, next) {
  if (!req.accepts('json')) {
    req.log.warn("Request does not accept application/json!");
  }
  req.log.info('Request ' + req.method + ' ' + req.url);
  res.setHeader('content-type', 'application/json');
  next();
}

function router(config, app, zookeeper) {
  var spatial = new _servicesSpatial2['default'](zookeeper);
  var summary = new _servicesSummary2['default'](config);

  app.post('/summary', app.logger.request(), js, summary.post.bind(summary));
  app.post('/spatial', app.logger.request(), js, spatial.create.bind(spatial));
  app.put('/spatial/:fourfours?', app.logger.request(), js, spatial.replace.bind(spatial));

  //meta
  app.get('/version', app.logger.request(), js, _servicesVersion2['default'].get);
  app.get('/heapdump', app.logger.request(), _utilMetrics2['default'].heapdump);
}

exports['default'] = router;
module.exports = exports['default'];