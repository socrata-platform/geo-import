'use strict';

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }; })();

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

describe('shapefile ingress', function () {
  var mockZk;
  var mockCore;
  var conf = (0, _libConfig2['default'])();
  var corePort = 7002; //coreport
  var url = 'http://localhost:' + conf.port;
  var app;

  beforeEach(function (onDone) {
    //for jankins
    this.timeout(6000);

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

  it('should be able to deal with a mostly null SHP', function (onDone) {
    this.timeout(80000);

    (0, _fixture.bufferJs)((0, _fixture.fixture)('smoke/CATCH_BASIN_LEAD_POLY.zip').pipe(_request2['default'].post({
      url: url + '/spatial',
      encoding: null,
      headers: {
        'Authorization': 'test-auth',
        'X-App-Token': 'app-token',
        'X-Socrata-Host': 'localhost:6668',
        'Content-Type': 'application/zip'
      }
    })), function (res, buffered) {
      expect(res.statusCode).to.equal(200);
      buffered.bbox.minx.should.be.approximately(-113.71250, .0001);
      buffered.bbox.miny.should.be.approximately(53.39732, .0001);
      buffered.bbox.maxx.should.be.approximately(-113.29525, .0001);
      buffered.bbox.maxy.should.be.approximately(53.65448, .0001);
      expect(buffered.layers.length).to.equal(1);

      expect(buffered.layers[0].layer.columns).to.eql([{
        fieldName: 'the_geom',
        name: 'the_geom',
        dataTypeName: 'line'
      }, {
        fieldName: 'facility',
        name: 'FACILITY',
        dataTypeName: 'text'
      }, {
        fieldName: 'type',
        name: 'TYPE',
        dataTypeName: 'text'
      }, {
        fieldName: 'year_const',
        name: 'YEAR_CONST',
        dataTypeName: 'number'
      }, {
        fieldName: 'nghbrhd',
        name: 'NGHBRHD',
        dataTypeName: 'text'
      }, {
        fieldName: 'nghbrhd_id',
        name: 'NGHBRHD_ID',
        dataTypeName: 'text'
      }, {
        fieldName: 'ward',
        name: 'WARD',
        dataTypeName: 'text'
      }, {
        fieldName: 'str_ave',
        name: 'STR_AVE',
        dataTypeName: 'text'
      }]);
      onDone();
    });
  });

  it('should be able to do a ~12mb SHP summary', function (onDone) {
    this.timeout(80000);

    (0, _fixture.bufferJs)((0, _fixture.fixture)('smoke/USBR_crs.zip').pipe(_request2['default'].post({
      url: url + '/summary',
      encoding: null,
      headers: {
        'Authorization': 'test-auth',
        'X-App-Token': 'app-token',
        'X-Socrata-Host': 'localhost:6668',
        'Content-Type': 'application/zip'
      }
    })), function (res, buffered) {
      expect(res.statusCode).to.equal(200);

      expect(buffered.layers.length).to.equal(1);

      var _buffered$layers = _slicedToArray(buffered.layers, 1);

      var l0 = _buffered$layers[0];

      expect(l0).to.eql({
        count: 0,
        projection: 'Google Maps Global Mercator',
        name: 'USBR_RegionalBoundaries',
        geometry: null,
        bbox: {
          minx: null,
          miny: null,
          maxx: null,
          maxy: null
        },
        columns: []
      });

      onDone();
    });
  });

  it('missing files with garbage included SHP summary', function (onDone) {
    this.timeout(80000);

    (0, _fixture.bufferJs)((0, _fixture.fixture)('smoke/wards-chicago.zip').pipe(_request2['default'].post({
      url: url + '/summary',
      encoding: null,
      headers: {
        'Authorization': 'test-auth',
        'X-App-Token': 'app-token',
        'X-Socrata-Host': 'localhost:6668',
        'Content-Type': 'application/zip'
      }
    })), function (res, buffered) {
      expect(res.statusCode).to.equal(200);
      expect(buffered.layers.length).to.equal(1);
      onDone();
    });
  });
});