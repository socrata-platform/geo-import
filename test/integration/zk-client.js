import {
  chai, expect
}
from 'chai';
import should from 'should';
import conf from '../../lib/config';
import Zookeeper from '../../lib/upstream/zookeeper';
import Logger from '../../lib/util/logger';

describe('zookeeper client wrapper', function() {

  it("can connect to zk", (onDone) => {
    var zk = new Zookeeper(conf())
    zk.once('connected', () => {
      onDone()
    })
    zk.connect();
  });
});