import service from './service';
import config from './config';
import ZKClient from './upstream/zookeeper';
import SegfaultHandler from 'segfault-handler';
import ofe from 'ofe';

ofe.call();
SegfaultHandler.registerHandler("crash.log");

var conf = config();
var zk = new ZKClient(conf);
service(zk, {}, (_app, _zk) => {});