/**
 * Not much to see here. Just some routes.
 */
import version from './services/version';
import Summary from './services/summary';
import Metrics from './util/metrics';
import logger from './util/logger';

function acceptJson(req, res, next) {
  if (!req.accepts('json')) {
    req.log.warn("Request does not accept application/json!");
  }
  req.log.info(`Request ${req.method} ${req.url}`);
  res.setHeader('content-type', 'application/json');
  next();
}


function router(app, zookeeper, metrics) {
  var summary = new Summary();

  app.post(
    '/summary',
    app.logger.decorateRequest(),
    acceptJson,
    metrics.decorateRequest(),
    summary.post.bind(summary)
  );

  //meta
  app.get('/version', app.logger.decorateRequest(), acceptJson, version.get);
  app.get('/metrics', app.logger.decorateRequest(), acceptJson, metrics.metrics.bind(metrics));
  app.get('/heapdump', app.logger.decorateRequest(), metrics.heapdump);

}

export default router;
