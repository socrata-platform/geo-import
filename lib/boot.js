import service from './service';
import config from './config';
import ZKClient from './upstream/zookeeper';

service({
  zkClient: ZKClient
}, (_app, _zk) => {});