import * as version from './services/version';
import Spatial from './services/spatial';


function router(config, app, zookeeper) {

  var spatial = new Spatial(zookeeper);

  app.get('/version', version.get);
  app.post('/spatial', spatial.post.bind(spatial));
}

export default router