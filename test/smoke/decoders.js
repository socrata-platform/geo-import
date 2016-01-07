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

var _libDecodersShapefile = require('../../lib/decoders/shapefile');

var _libDecodersShapefile2 = _interopRequireDefault(_libDecodersShapefile);

var _libDecodersKmz = require('../../lib/decoders/kmz');

var _libDecodersKmz2 = _interopRequireDefault(_libDecodersKmz);

var _libDecodersKml = require('../../lib/decoders/kml');

var _libDecodersKml2 = _interopRequireDefault(_libDecodersKml);

var _libDecodersGeojson = require('../../lib/decoders/geojson');

var _libDecodersGeojson2 = _interopRequireDefault(_libDecodersGeojson);

var _libDecodersDisk = require('../../lib/decoders/disk');

var _libDecodersDisk2 = _interopRequireDefault(_libDecodersDisk);

var res;
var expect = _chai2['default'].expect;

function kmzDecoder() {
  res = new _events.EventEmitter();
  return new _libDecodersKmz2['default'](new _libDecodersDisk2['default'](res));
}
function shpDecoder() {
  res = new _events.EventEmitter();
  return [new _libDecodersShapefile2['default'](new _libDecodersDisk2['default'](res)), res];
}
function kmlDecoder() {
  res = new _events.EventEmitter();
  return [new _libDecodersKml2['default'](new _libDecodersDisk2['default'](res)), res];
}
function geojsonDecoder() {
  res = new _events.EventEmitter();
  return [new _libDecodersGeojson2['default'](new _libDecodersDisk2['default'](res)), res];
}

describe('decoders', function () {

  afterEach(function () {
    if (res) res.emit('finish');
  });

  it('should handle real multi chunk kmz', function (onDone) {
    this.timeout(150000);
    var count = 0;
    (0, _fixture.fixture)('smoke/usbr.kmz').pipe(kmzDecoder()).pipe(es.mapSync(function (thing) {
      count++;
    })).on('end', function () {
      expect(count).to.equal(5);
      onDone();
    });
  });

  it('should handle real multi chunk shapefile', function (onDone) {
    this.timeout(100000);
    var count = 0;

    var _shpDecoder = shpDecoder();

    var _shpDecoder2 = _slicedToArray(_shpDecoder, 2);

    var decoder = _shpDecoder2[0];
    var res = _shpDecoder2[1];

    (0, _fixture.fixture)('smoke/USBR_crs.zip').pipe(decoder).pipe(es.mapSync(function (thing) {
      count++;
    })).on('end', function () {
      res.emit('finish');
      expect(count).to.equal(5);
      onDone();
    });
  });

  it('should handle real multi chunk kml', function (onDone) {
    this.timeout(100000);
    var count = 0;

    var _kmlDecoder = kmlDecoder();

    var _kmlDecoder2 = _slicedToArray(_kmlDecoder, 2);

    var decoder = _kmlDecoder2[0];
    var res = _kmlDecoder2[1];

    (0, _fixture.fixture)('smoke/usbr.kml').pipe(decoder).pipe(es.mapSync(function (thing) {
      count++;
    })).on('end', function () {
      res.emit('finish');
      expect(count).to.equal(5);
      onDone();
    });
  });

  it('should handle real multi chunk geojson', function (onDone) {
    this.timeout(250000);
    var count = 0;

    var _geojsonDecoder = geojsonDecoder();

    var _geojsonDecoder2 = _slicedToArray(_geojsonDecoder, 2);

    var decoder = _geojsonDecoder2[0];
    var res = _geojsonDecoder2[1];

    (0, _fixture.fixture)('smoke/usbr.geojson').pipe(decoder).pipe(es.mapSync(function (thing) {
      count++;
    })).on('end', function () {
      res.emit('finish');
      expect(count).to.equal(5);
      onDone();
    });
  });

  it('many many chunks of kml should end up with numbers', function (onDone) {
    this.timeout(100000);
    var count = 0;

    var _kmlDecoder3 = kmlDecoder();

    var _kmlDecoder32 = _slicedToArray(_kmlDecoder3, 2);

    var decoder = _kmlDecoder32[0];
    var res = _kmlDecoder32[1];

    (0, _fixture.fixture)('smoke/boundaries.kml').pipe(decoder).pipe(es.mapSync(function (l) {
      l.columns[0].mapCoordinates(function (_ref) {
        var _ref2 = _slicedToArray(_ref, 2);

        var x = _ref2[0];
        var y = _ref2[1];

        expect(x).to.not.eql(NaN);
        expect(y).to.not.eql(NaN);
      });
    })).on('end', function (layers) {
      res.emit('finish');
      onDone();
    });
  });
});