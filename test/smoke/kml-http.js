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

var res;
var expect = _chai2['default'].expect;

describe('kml ingress', function () {
  var mockZk;
  var mockCore;
  var conf = (0, _libConfig2['default'])();
  var corePort = 7002; //coreport
  var url = 'http://localhost:' + conf.port;
  var app;

  beforeEach(function (onDone) {
    mockZk = new _servicesMockZk2['default'](corePort);
    (0, _libService2['default'])(mockZk, {}, function (a, zk) {
      app = a;
      mockCore = new _servicesMockCore2['default'](corePort);
      onDone();
    });
  });

  afterEach(function () {
    mockCore.close();
    app.close();
  });

  it('should be able to do a ~30mb KML summary', function (onDone) {
    this.timeout(150000);

    (0, _fixture.bufferJs)((0, _fixture.fixture)('smoke/usbr.kml').pipe(_request2['default'].post({
      url: url + '/summary',
      headers: {
        'Authorization': 'test-auth',
        'X-App-Token': 'app-token',
        'X-Socrata-Host': 'localhost:6668',
        'Content-Type': 'application/vnd.google-earth.kml+xml'
      }
    })), function (res, buffered) {
      expect(res.statusCode).to.equal(200);

      expect(buffered.layers).to.eql([]);

      // //the bbox is only populated when reading out from disk and reprojecting
      // //which doesn't happen on a summary, so bbox needs to be all nulls
      // expect(l0).to.eql({
      //   count: 5,
      //   projection: 'GEOGCS["WGS 84",\n    DATUM["WGS_1984",\n        SPHEROID["WGS 84",6378137,298.257223563,\n            AUTHORITY["EPSG","7030"]],\n        TOWGS84[0,0,0,0,0,0,0],\n        AUTHORITY["EPSG","6326"]],\n    PRIMEM["Greenwich",0,\n        AUTHORITY["EPSG","8901"]],\n    UNIT["degree",0.0174532925199433,\n        AUTHORITY["EPSG","9108"]],\n    AUTHORITY["EPSG","4326"]]',
      //   name: 'layer_0',
      //   geometry: 'multipolygon',
      //   bbox: {
      //     minx: null,
      //     miny: null,
      //     maxx: null,
      //     maxy: null
      //   },
      //   columns: [{
      //     fieldName: 'the_geom',
      //     name: 'the_geom',
      //     dataTypeName: 'multipolygon'
      //   }, {
      //     fieldName: 'objectid',
      //     name: 'objectid',
      //     dataTypeName: 'text'
      //   }, {
      //     fieldName: 'region',
      //     name: 'region',
      //     dataTypeName: 'text'
      //   }, {
      //     fieldName: 'name',
      //     name: 'name',
      //     dataTypeName: 'text'
      //   }]
      // });

      onDone();
    });
  });

  it('should be able to do a ~30mb KML upsert', function (onDone) {
    this.timeout(150000);
    (0, _fixture.bufferJs)((0, _fixture.fixture)('smoke/usbr.kml').pipe(_request2['default'].post({
      url: url + '/spatial',
      headers: {
        'Authorization': 'test-auth',
        'X-App-Token': 'app-token',
        'X-Socrata-Host': 'localhost:6668',
        'Content-Type': 'application/vnd.google-earth.kml+xml'
      }
    })), function (res, buffered) {
      expect(res.statusCode).to.equal(200);

      expect(buffered.layers[0].layer.count).to.equal(5);

      //the bbox is only populated on reading out from disk, which needs
      //to happen for an upsert, so this is a reasonable smoketest
      var _buffered$bbox = buffered.bbox;
      var maxx = _buffered$bbox.maxx;
      var maxy = _buffered$bbox.maxy;
      var minx = _buffered$bbox.minx;
      var miny = _buffered$bbox.miny;

      maxx.should.be.approximately(-93.50813092109847, 0.00001);
      maxy.should.be.approximately(49.002493028983906, 0.00001);
      minx.should.be.approximately(-124.73317395017921, 0.00001);
      miny.should.be.approximately(25.850648582704334, 0.00001);

      onDone();
    });
  });
});