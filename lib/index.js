'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _service = require('./service');

var _service2 = _interopRequireDefault(_service);

var _config = require('./config');

var _config2 = _interopRequireDefault(_config);

var _utilMetrics = require('./util/metrics');

var _utilMetrics2 = _interopRequireDefault(_utilMetrics);

var _upstreamZookeeper = require('./upstream/zookeeper');

var _upstreamZookeeper2 = _interopRequireDefault(_upstreamZookeeper);

var _segfaultHandler = require('segfault-handler');

var _segfaultHandler2 = _interopRequireDefault(_segfaultHandler);

_segfaultHandler2['default'].registerHandler("crash.log");
var conf = (0, _config2['default'])();
new _utilMetrics2['default'](conf);
var zk = new _upstreamZookeeper2['default'](conf);
(0, _service2['default'])(zk, {}, function (_app, _zk) {});