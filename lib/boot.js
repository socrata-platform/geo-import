import service from './service';
import config from './config';
import ZKClient from './upstream/zookeeper';

var conf = config();
service({
  port: conf.port,
  zkClient: ZKClient
}, (_app, _zk) => {
  console.log(`Service started, listening on ${conf.port}`)
});