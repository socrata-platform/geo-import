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

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _fixture = require('../fixture');

var _request = require('request');

var _request2 = _interopRequireDefault(_request);

var _servicesMockZk = require('../services/mock-zk');

var _servicesMockZk2 = _interopRequireDefault(_servicesMockZk);

var _events = require('events');

var _libConfig = require('../../lib/config');

var _libConfig2 = _interopRequireDefault(_libConfig);

var _libService = require('../../lib/service');

var _libService2 = _interopRequireDefault(_libService);

var expect = _chai2['default'].expect;

describe('summary service', function () {
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

  var sizeOf = function sizeOf(fname) {
    return _fs2['default'].statSync(__dirname + '/../fixtures/' + fname).size;
  };

  it('can make an abbreviated summary for large geojsons', function (onDone) {
    var fx = 'simple_points_large.json';
    (0, _fixture.bufferJs)((0, _fixture.fixture)(fx).pipe(_request2['default'].post({
      url: url + '/summary',
      headers: {
        'Authorization': 'test-auth',
        'X-App-Token': 'app-token',
        'X-Socrata-Host': 'localhost:6668',
        'Content-Type': 'application/json',
        'Content-Length': sizeOf(fx),
        'X-Blob-Length': sizeOf(fx)
      }
    })), function (res, buffered) {
      expect(res.statusCode).to.equal(200);
      expect(res.headers['content-type']).to.contain('application/json');
      expect(buffered.layers).to.eql([]);
      onDone();
    });
  });

  it('can make an abbreviated summary for large kmls', function (onDone) {
    //for jankins
    this.timeout(6000);
    var fx = 'usbr_gt_50k.kml';
    (0, _fixture.bufferJs)((0, _fixture.fixture)(fx).pipe(_request2['default'].post({
      url: url + '/summary',
      headers: {
        'Authorization': 'test-auth',
        'X-App-Token': 'app-token',
        'X-Socrata-Host': 'localhost:6668',
        'Content-Type': 'application/vnd.google-earth.kml+xml',
        'Content-Length': sizeOf(fx),
        'X-Blob-Length': sizeOf(fx)
      }
    })), function (res, buffered) {
      expect(res.statusCode).to.equal(200);
      expect(res.headers['content-type']).to.contain('application/json');
      expect(buffered.layers).to.eql([]);
      //setTimeout on the finish cb makes the test fail if
      //the request tries to send the request twice, which was
      //happening for streams that didn't bind to the correct
      //events
      setTimeout(onDone, 10);
    });
  });

  it('can make an abbreviated summary for large kmzs', function (onDone) {
    //for jankins
    this.timeout(8000);

    var fx = 'usbr_gt_50k.kmz';
    (0, _fixture.bufferJs)((0, _fixture.fixture)(fx).pipe(_request2['default'].post({
      url: url + '/summary',
      headers: {
        'Authorization': 'test-auth',
        'X-App-Token': 'app-token',
        'X-Socrata-Host': 'localhost:6668',
        'Content-Type': 'application/vnd.google-earth.kmz',
        'Content-Length': sizeOf(fx),
        'X-Blob-Length': sizeOf(fx)
      }
    })), function (res, buffered) {
      expect(res.statusCode).to.equal(200);
      expect(res.headers['content-type']).to.contain('application/json');
      expect(buffered.layers).to.eql([]);
      //setTimeout on the finish cb makes the test fail if
      //the request tries to send the request twice, which was
      //happening for streams that didn't bind to the correct
      //events
      setTimeout(onDone, 10);
    });
  });

  it('can make an full summary for large shapefiles above the limit', function (onDone) {

    var fx = 'wards_gt_50k.zip';
    (0, _fixture.bufferJs)((0, _fixture.fixture)(fx).pipe(_request2['default'].post({
      url: url + '/summary',
      headers: {
        'Authorization': 'test-auth',
        'X-App-Token': 'app-token',
        'X-Socrata-Host': 'localhost:6668',
        'Content-Type': 'application/zip',
        'Content-Length': sizeOf(fx),
        'X-Blob-Length': sizeOf(fx)
      }
    })), function (res, buffered) {
      expect(res.statusCode).to.equal(200);
      expect(res.headers['content-type']).to.contain('application/json');
      expect(buffered.layers).to.eql([{
        "bbox": {
          "maxx": null,
          "maxy": null,
          "minx": null,
          "miny": null
        },
        "columns": [],
        "count": 0,
        "geometry": null,
        "name": "wards_chicago_mid_simp",
        "projection": "WGS 84"
      }]);

      onDone();
    });
  });

  it('can post single layer geojson and it will make a summary', function (onDone) {
    var fx = 'simple_points.json';
    (0, _fixture.bufferJs)((0, _fixture.fixture)(fx).pipe(_request2['default'].post({
      url: url + '/summary',
      headers: {
        'Authorization': 'test-auth',
        'X-App-Token': 'app-token',
        'X-Socrata-Host': 'localhost:6668',
        'Content-Type': 'application/json',
        'Content-Length': sizeOf(fx),
        'X-Blob-Length': sizeOf(fx)
      }
    })), function (res, buffered) {
      expect(res.statusCode).to.equal(200);
      expect(res.headers['content-type']).to.contain('application/json');

      var _buffered$layers = _slicedToArray(buffered.layers, 1);

      var layer = _buffered$layers[0];

      expect(layer.projection).to.equal('WGS 84');
      expect(layer.name).to.equal('layer_0');
      onDone();
    });
  });

  it('can post multi layer geojson and it will make a summary', function (onDone) {
    var fx = 'points_and_lines.json';
    (0, _fixture.bufferJs)((0, _fixture.fixture)(fx).pipe(_request2['default'].post({
      url: url + '/summary',
      headers: {
        'Authorization': 'test-auth',
        'X-App-Token': 'app-token',
        'X-Socrata-Host': 'localhost:6668',
        'Content-Type': 'application/json',
        'Content-Length': sizeOf(fx),
        'X-Blob-Length': sizeOf(fx)
      }
    })), function (res, buffered) {
      expect(res.statusCode).to.equal(200);
      expect(res.headers['content-type']).to.contain('application/json');

      var _buffered$layers2 = _slicedToArray(buffered.layers, 2);

      var l0 = _buffered$layers2[0];
      var l1 = _buffered$layers2[1];

      expect(l0.projection).to.equal('NAD83 / UTM zone 15N');
      expect(l0.name).to.equal('layer_0');
      expect(l0.geometry).to.equal('line');

      expect(l0.bbox).to.eql({
        minx: null,
        miny: null,
        maxx: null,
        maxy: null
      });

      expect(l0.columns).to.eql([{
        fieldName: 'the_geom',
        name: 'the_geom',
        dataTypeName: 'line'
      }, {
        fieldName: 'a_string',
        name: 'A_STRING',
        dataTypeName: 'text'
      }]);

      expect(l1.projection).to.equal('NAD83 / UTM zone 15N');
      expect(l1.name).to.equal('layer_1');
      expect(l1.geometry).to.equal('point');

      expect(l1.bbox).to.eql({
        minx: null,
        miny: null,
        maxx: null,
        maxy: null
      });

      onDone();
    });
  });
});