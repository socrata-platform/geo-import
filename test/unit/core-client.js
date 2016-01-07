'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _chai = require('chai');

var _should = require('should');

var _should2 = _interopRequireDefault(_should);

var _servicesMockCore = require('../services/mock-core');

var _servicesMockCore2 = _interopRequireDefault(_servicesMockCore);

var _servicesMockZk = require('../services/mock-zk');

var _servicesMockZk2 = _interopRequireDefault(_servicesMockZk);

var _libConfig = require('../../lib/config');

var _libConfig2 = _interopRequireDefault(_libConfig);

var _libUpstreamCore = require('../../lib/upstream/core');

describe('core client', function () {
  var mockCore;
  var mockZk;
  var port = 6668;
  var url = 'http://localhost:' + port;

  beforeEach(function (onDone) {
    mockZk = new _servicesMockZk2['default'](port);
    mockZk.connect();
    mockZk.on('connected', function () {
      mockCore = new _servicesMockCore2['default'](port);
      onDone();
    });
  });

  afterEach(function () {
    mockCore.close();
  });

  it("can build auth from a request", function () {
    var request = {
      headers: {
        'authorization': 'test-auth',
        'x-app-token': 'test-token',
        'x-socrata-host': 'test-host'
      },
      log: {
        info: function info() {}
      }
    };
    var auth = new _libUpstreamCore.CoreAuth(request);

    (0, _chai.expect)(auth.host).to.eql('test-host');
    (0, _chai.expect)(auth.appToken).to.eql('test-token');
    (0, _chai.expect)(auth.authToken).to.eql('test-auth');
  });

  it('passes headers through to core', function (onDone) {
    var request = {
      headers: {
        'x-app-token': 'test-token',
        'x-socrata-host': 'test-host'
      },
      log: {
        info: function info() {}
      }
    };
    var auth = new _libUpstreamCore.CoreAuth(request);
    var core = new _libUpstreamCore.Core(auth, mockZk);

    core.create('my_layer', function (err, res) {
      (0, _chai.expect)(err.statusCode).to.equal(400);
      onDone();
    });
  });

  it("can make a create request to core", function (onDone) {
    var request = {
      headers: {
        'authorization': 'test-auth',
        'x-app-token': 'test-token',
        'x-socrata-host': 'test-host'
      },
      log: {
        info: function info() {}
      }
    };
    var auth = new _libUpstreamCore.CoreAuth(request);
    var core = new _libUpstreamCore.Core(auth, mockZk);

    core.create('my_layer', function (err, res) {
      if (err) throw new Error('Got invalid status ' + err.statusCode);

      (0, _chai.expect)(res.statusCode).to.equal(200);
      (0, _chai.expect)(res.body.id).to.equal('qs32-qpt7');
      onDone();
    });
  });

  it("can make a replace request to core", function (onDone) {
    var request = {
      headers: {
        'authorization': 'test-auth',
        'x-app-token': 'test-token',
        'x-socrata-host': 'test-host'
      },
      log: {
        info: function info() {}
      }
    };
    var auth = new _libUpstreamCore.CoreAuth(request);
    var core = new _libUpstreamCore.Core(auth, mockZk);

    core.replace('my_layer', function (err, res) {
      if (err) throw new Error('Got invalid status ' + err.statusCode);

      (0, _chai.expect)(res.statusCode).to.equal(200);
      onDone();
    });
  });
});