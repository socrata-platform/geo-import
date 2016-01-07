'use strict';

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _underscore = require('underscore');

var _underscore2 = _interopRequireDefault(_underscore);

var _chai = require('chai');

var _chai2 = _interopRequireDefault(_chai);

var _should = require('should');

var _should2 = _interopRequireDefault(_should);

var _eventStream = require('event-stream');

var es = _interopRequireWildcard(_eventStream);

var _fixture = require('../fixture');

var _request = require('request');

var _request2 = _interopRequireDefault(_request);

var _servicesMockCore = require('../services/mock-core');

var _servicesMockCore2 = _interopRequireDefault(_servicesMockCore);

var _servicesMockZk = require('../services/mock-zk');

var _servicesMockZk2 = _interopRequireDefault(_servicesMockZk);

var _events = require('events');

var _libConfig = require('../../lib/config');

var _libConfig2 = _interopRequireDefault(_libConfig);

var _libService = require('../../lib/service');

var _libService2 = _interopRequireDefault(_libService);

var _packageJson = require('../../package.json');

var _packageJson2 = _interopRequireDefault(_packageJson);

var expect = _chai2['default'].expect;

describe('version service', function () {
  var app;
  var port = (0, _libConfig2['default'])().port;
  var url = 'http://localhost:' + port;
  var corePort = 7000;

  beforeEach(function (onDone) {
    var zk = new _servicesMockZk2['default'](corePort);
    (0, _libService2['default'])(zk, {}, function (a, zk) {
      app = a;
      onDone();
    });
  });

  afterEach(function () {
    return app.close();
  });

  it('can get the version of the service', function (onDone) {
    _request2['default'].get(url + '/version', function (err, res) {
      expect(JSON.parse(res.body)).to.eql({
        version: _packageJson2['default'].version,
        name: _packageJson2['default'].name
      });
      expect(res.statusCode).to.equal(200);
      expect(res.headers['content-type']).to.contain('application/json');
      onDone();
    });
  });
});