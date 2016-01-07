'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _chai = require('chai');

var _should = require('should');

var _should2 = _interopRequireDefault(_should);

var _libConfig = require('../../lib/config');

var _libConfig2 = _interopRequireDefault(_libConfig);

var _libUpstreamZookeeper = require('../../lib/upstream/zookeeper');

var _libUpstreamZookeeper2 = _interopRequireDefault(_libUpstreamZookeeper);

var _libUtilLogger = require('../../lib/util/logger');

var _libUtilLogger2 = _interopRequireDefault(_libUtilLogger);

describe('zookeeper client wrapper', function () {

  it("can connect to zk", function (onDone) {
    var zk = new _libUpstreamZookeeper2['default']((0, _libConfig2['default'])());
    zk.once('connected', function () {
      onDone();
    });
    zk.connect();
  });
});