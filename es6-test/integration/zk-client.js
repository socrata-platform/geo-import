import { expect } from 'chai';
import should from 'should';
import conf from '../../lib/config/index.js';
import Zookeeper from '../../lib/upstream/zookeeper.js';
import Logger from '../../lib/util/logger.js';

describe('zookeeper client wrapper', function() {
  it("can connect to zk", (onDone) => {
    var zk = new Zookeeper(conf());
    zk.once('connected', () => {
      onDone();
    });
    zk.connect();
  });
});
