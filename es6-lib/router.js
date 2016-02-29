/**
 * Not much to see here. Just some routes.
 */
import version from './services/version';
import Spatial from './services/spatial';
import Summary from './services/summary';
import Metrics from './util/metrics';
import logger from './util/logger';

function js(req, res, next) {
  if(!req.accepts('json')) {
    req.log.warn("Request does not accept application/json!");
  }
  req.log.info(`Request ${req.method} ${req.url}`);
  res.setHeader('content-type', 'application/json');
  next();
}


function router(config, app, zookeeper, metrics) {
  var spatial = new Spatial(zookeeper);
  var summary = new Summary(config);

  app.post('/summary', app.logger.request(), js, metrics.request(), summary.post.bind(summary));
  app.post('/spatial', app.logger.request(), js, metrics.request(), spatial.create.bind(spatial));
  app.put('/spatial/:fourfours?', app.logger.request(), js, metrics.request(), spatial.replace.bind(spatial));

  //meta
  app.get('/version', app.logger.request(), js, version.get);
  app.get('/metrics', app.logger.request(), js, metrics.metrics.bind(metrics));
  app.get('/heapdump', app.logger.request(),    metrics.heapdump);

}

export default router;