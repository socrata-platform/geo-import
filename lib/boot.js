import service from './service';
import config from './config';
import ZKClient from './upstream/zookeeper';

var zk new ZKClient(config());
service(zk, {}, (_app, _zk) => {});