import service from './service';
import config from './config';
import ZKClient from './upstream/zookeeper';

var conf = config();
var zk = new ZKClient(conf);
service(zk, {}, (_app, _zk) => {});
