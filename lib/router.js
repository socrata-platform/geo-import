/**
 * Not much to see here. Just some routes.
 */
import version from './services/version';
import Spatial from './services/spatial';
import Summary from './services/summary';
import logger from './util/logger';

function js(req, res, next) {
  // req.setEncoding('binary');
  if(!req.accepts('json')) {
    req.log.warn("Request does not accept application/json!")
  }
  res.setHeader('content-type', 'application/json');
  next();
}


function router(config, app, zookeeper) {
  var spatial = new Spatial(zookeeper);
  var summary = new Summary();

  app.get('/version', js, app.logger.request(), version.get);
  app.post('/summary', js, app.logger.request(), summary.post.bind(summary));
  app.post('/spatial', js, app.logger.request(), spatial.post.bind(spatial));
}

export default router;