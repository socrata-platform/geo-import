/**
 * Not much to see here. Just some routes.
 */
import version from './services/version';
import Spatial from './services/spatial';
import Summary from './services/summary';

function js(req, res, next) {
  req.setEncoding('binary');
  req.on('data', (chunk) => {
    // console.log("chunk", typeof chunk) //TODO: log this
  });
  if(!req.accepts('json')) {
    console.warn("non json accept header!");

  }
  res.setHeader('content-type', 'application/json');
  next();
}

function logger(req, res, next) {
  // console.log("Request started", req.url); //TODO: log this
  // console.log("Request has content type", req.headers['content-type']) //TODO: log this

  res.on('finish', () => {
    // console.log("Request finished with", res.statusCode) //TODO: log this
  });

  next();
}


function router(config, app, zookeeper) {
  var spatial = new Spatial(zookeeper);
  var summary = new Summary();
  app.get('/version', js, logger, version.get);
  app.post('/summary', js, logger, summary.post.bind(summary));
  app.post('/spatial', js, logger, spatial.post.bind(spatial));
}

export default router;