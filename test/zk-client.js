import {
  chai, expect
}
from 'chai';
import should from 'should';
import conf from '../lib/config';
import Zookeeper from '../lib/upstream/zookeeper';
import Logger from '../lib/util/logger';

describe('integration :: zookeeper client wrapper', function() {

  it("can connect to zk", (onDone) => {
    var config = conf();
    var zk = new Zookeeper(config)
    zk.once('connected', () => {
      onDone()
    })
    zk.connect();
  });


  // it("can get the core service", (onDone) => {
  //   var config = conf();
  //   var zk = new Zookeeper(config)
  //   zk.once('connected', () => {
  //     zk.getCore((err, url) => {
  //       expect(url).to.contain('http://')
  //       onDone()
  //     })
  //   })
  //   zk.connect();
  // });

});