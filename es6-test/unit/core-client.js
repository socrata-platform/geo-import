import {
  chai, expect
}
from 'chai';
import should from 'should';
import CoreService from '../services/mock-core';
import MockZKClient from '../services/mock-zk';
import config from '../../lib/config';
import {
  CoreAuth, Core
}
from '../../lib/upstream/core';

describe('core client', function() {
  var mockCore;
  var mockZk;
  var port = 6668;
  var url = `http://localhost:${port}`;

  beforeEach(function(onDone) {
    mockZk = new MockZKClient(port);
    mockZk.connect();
    mockZk.on('connected', function() {
      mockCore = new CoreService(port);
      onDone();
    });
  });

  afterEach(function() {
    mockCore.close();
  });



  it("will pass back 503 errors from zk", function(onDone) {
    var request = {
      headers: {
        'x-app-token': 'test-token',
        'x-socrata-host': 'test-host',
      },
      log: {
        info: () => {}
      }
    };
    var auth = new CoreAuth(request);
    var core = new Core(auth, mockZk);
    mockZk.enableErrors();

    core.create('my_layer', (err, res) => {
      expect(err.statusCode).to.equal(503);
      expect(err.toJSON().type).to.equal('bad_response_from_server');
      onDone();
    });
  });



  it("can build auth from a request", function() {
    var request = {
      headers: {
        'authorization': 'test-auth',
        'x-app-token': 'test-token',
        'x-socrata-host': 'test-host',
      },
      log: {
        info: () => {}
      }
    };
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
      },
      log: {
        info: () => {}
      }
    };
    var auth = new CoreAuth(request);
    var core = new Core(auth, mockZk);

    core.create('my_layer', (err, res) => {
      expect(err.statusCode).to.equal(400);
      onDone();
    });

  });


  it("can make a create request to core", function(onDone) {
    var request = {
      headers: {
        'authorization': 'test-auth',
        'x-app-token': 'test-token',
        'x-socrata-host': 'test-host',
      },
      log: {
        info: () => {}
      }
    };
    var auth = new CoreAuth(request);
    var core = new Core(auth, mockZk);

    core.create('my_layer', (err, res) => {
      if (err) throw new Error(`Got invalid status ${err.statusCode}`);

      expect(res.statusCode).to.equal(200);
      expect(res.body.id).to.equal('qs32-qpt7');
      onDone();
    });
  });

  it("can make a replace request to core", function(onDone) {
    var request = {
      headers: {
        'authorization': 'test-auth',
        'x-app-token': 'test-token',
        'x-socrata-host': 'test-host',
      },
      log: {
        info: () => {}
      }
    };
    var auth = new CoreAuth(request);
    var core = new Core(auth, mockZk);

    core.replace('my_layer', (err, res) => {
      if (err) throw new Error(`Got invalid status ${err.statusCode}`);

      expect(res.statusCode).to.equal(200);
      onDone();
    });
  });


});