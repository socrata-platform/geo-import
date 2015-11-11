/**
 * Not much to see here. Just some routes.
 */
import version from './services/version';
import Spatial from './services/spatial';
import Summary from './services/summary';


function js(req, res, next) {
  if(!req.accepts('json')) {
    console.warn("non json accept header!");

  }
  res.setHeader('content-type', 'application/json');
  next();
}



function router(config, app, zookeeper) {
  var spatial = new Spatial(zookeeper);
  var summary = new Summary();

  app.get('/version', js, version.get);
  app.post('/summary', js, summary.post.bind(summary));
  app.post('/spatial', js, spatial.post.bind(spatial));
}

export default router