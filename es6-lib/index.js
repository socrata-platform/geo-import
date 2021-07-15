import service from './service.js';
import config from './config/index.js';
import ZKClient from './upstream/zookeeper.js';

var conf = config();
var zk = new ZKClient(conf);
service(zk, {}, (_app, _zk) => {});
