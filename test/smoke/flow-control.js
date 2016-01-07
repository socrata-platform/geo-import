'use strict';

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }; })();

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

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

var _libDecodersMerger = require('../../lib/decoders/merger');

var _libDecodersMerger2 = _interopRequireDefault(_libDecodersMerger);

var _libDecodersDisk = require('../../lib/decoders/disk');

var _libDecodersDisk2 = _interopRequireDefault(_libDecodersDisk);

var _stream = require('stream');

var res;
var expect = _chai2['default'].expect;

function kmzDecoder() {
  res = new _events.EventEmitter();
  return [new _libDecodersKmz2['default'](new _libDecodersDisk2['default'](res)), res];
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

var SlowConsumer = (function (_Transform) {
  _inherits(SlowConsumer, _Transform);

  function SlowConsumer() {
    _classCallCheck(this, SlowConsumer);

    _get(Object.getPrototypeOf(SlowConsumer.prototype), 'constructor', this).call(this, {
      objectMode: true
    });
  }

  _createClass(SlowConsumer, [{
    key: '_transform',
    value: function _transform(chunk, encoding, done) {
      setTimeout(function () {
        done(false, chunk);
      }, 50);
    }
  }]);

  return SlowConsumer;
})(_stream.Transform);

describe('flow control', function () {
  afterEach(function () {
    if (res) res.emit('finish');
  });

  it('will not overwhelm geojson stream consumer', function (onDone) {
    this.timeout(25000);
    var count = 0;

    var _geojsonDecoder = geojsonDecoder();

    var _geojsonDecoder2 = _slicedToArray(_geojsonDecoder, 2);

    var decoder = _geojsonDecoder2[0];
    var res = _geojsonDecoder2[1];

    (0, _fixture.fixture)('smoke/wards.geojson').pipe(decoder).pipe(new SlowConsumer()).pipe(es.mapSync(function () {
      //length of things that are being buffered in the decoder
      expect(decoder._readableState.length).to.be.at.most(20);
      count++;
    })).on('end', function () {
      res.emit('finish');
      expect(count).to.equal(53);
      onDone();
    });
  });

  it('will not overwhelm kml stream consumer', function (onDone) {
    this.timeout(10000);
    var count = 0;

    var _kmlDecoder = kmlDecoder();

    var _kmlDecoder2 = _slicedToArray(_kmlDecoder, 2);

    var decoder = _kmlDecoder2[0];
    var res = _kmlDecoder2[1];

    (0, _fixture.fixture)('smoke/wards.kml').pipe(decoder).pipe(new SlowConsumer()).pipe(es.mapSync(function () {
      expect(decoder._readableState.length).to.be.at.most(20);
      count++;
    })).on('end', function () {
      res.emit('finish');
      expect(count).to.equal(53);
      onDone();
    });
  });

  it('will not overwhelm kml stream consumer', function (onDone) {
    this.timeout(10000);
    var count = 0;

    var _kmzDecoder = kmzDecoder();

    var _kmzDecoder2 = _slicedToArray(_kmzDecoder, 2);

    var decoder = _kmzDecoder2[0];
    var res = _kmzDecoder2[1];

    (0, _fixture.fixture)('smoke/wards.kmz').pipe(decoder).pipe(new SlowConsumer()).pipe(es.mapSync(function () {
      expect(decoder._readableState.length).to.be.at.most(20);
      count++;
    })).on('end', function () {
      res.emit('finish');
      expect(count).to.equal(53);
      onDone();
    });
  });

  it('will not overwhelm shapefile stream consumer', function (onDone) {
    this.timeout(10000);
    var count = 0;

    var _shpDecoder = shpDecoder();

    var _shpDecoder2 = _slicedToArray(_shpDecoder, 2);

    var decoder = _shpDecoder2[0];
    var res = _shpDecoder2[1];

    (0, _fixture.fixture)('smoke/wards.zip').pipe(decoder).pipe(new SlowConsumer()).pipe(es.mapSync(function () {
      expect(decoder._readableState.length).to.be.at.most(20);
      count++;
    })).on('end', function () {
      res.emit('finish');
      expect(count).to.equal(53);
      onDone();
    });
  });

  it('will not overwhelm merger stream consumer', function (onDone) {
    this.timeout(10000);
    var count = 0;

    var res = new _events.EventEmitter();
    var disk = new _libDecodersDisk2['default'](res);

    var decoder = new _libDecodersShapefile2['default'](disk);
    var merger = new _libDecodersMerger2['default'](disk, []);

    (0, _fixture.fixture)('smoke/wards.zip').pipe(decoder).pipe(merger).on('end', function (layers) {
      layers.map(function (layer) {
        layer.pipe(new SlowConsumer()).pipe(es.mapSync(function (thing) {
          expect(layer._readableState.length).to.be.at.most(64000);
          return thing;
        })).on('end', function () {
          res.emit('finish');
          onDone();
        });
      });
    });
  });
});