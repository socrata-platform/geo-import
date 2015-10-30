import {
  chai, expect
}
from 'chai';
import should from 'should';
import CoreService from './services/mock-core';
import MockZKClient from './services/mock-zk';
import config from '../lib/config';
import {
  CoreAuth, Core
}
from '../lib/upstream/core';

describe('core client', function() {
  var mockCore;
  var mockZk;
  var port = 6668;
  var url = `http://localhost:${port}`

  beforeEach(function(onDone) {
    mockZk = new MockZKClient()
    mockZk.connect();
    mockZk.on('connected', function() {
      mockCore = new CoreService(port);
      onDone()
    })
  });

  afterEach(function() {
    mockCore.close();
  });


  it("can build auth from a request", function() {
    var request = {
      headers: {
        'authorization': 'test-auth',
        'x-app-token': 'test-token',
        'x-socrata-host': 'test-host',
      }
    }
    var auth = new CoreAuth(request);

    expect(auth.host).to.eql('test-host');
    expect(auth.appToken).to.eql('test-token');
    expect(auth.authToken).to.eql('test-auth');
  });


  it('passes headers through to core', function(onDone) {
    var request = {
      headers: {
        'x-app-token': 'test-token',
        'x-socrata-host': 'test-host',
      }
    }
    var auth = new CoreAuth(request);
    var core = new Core(auth, mockZk)

    core.create('my_layer', (err, res) => {
      expect(err.statusCode).to.equal(400);
      onDone()
    });

  });


  it("can make a create request to core", function(onDone) {
    var request = {
      headers: {
        'authorization': 'test-auth',
        'x-app-token': 'test-token',
        'x-socrata-host': 'test-host',
      }
    }
    var auth = new CoreAuth(request);
    var core = new Core(auth, mockZk)

    core.create('my_layer', (err, res) => {
      if (err) throw new Error(`Got invalid status ${err.statusCode}`);

      expect(res.statusCode).to.equal(200);
      expect(res.body.id).to.equal('qs32-qpt7')
      onDone()
    });


  });


});