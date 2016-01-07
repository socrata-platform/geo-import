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

var _querystring = require('querystring');

var _querystring2 = _interopRequireDefault(_querystring);

var expect = _chai2['default'].expect;

describe('spatial service', function () {
  var mockZk;
  var mockCore;
  var conf = (0, _libConfig2['default'])();
  var corePort = 7001; //coreport
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

  it('can post geojson and it will make a create dataset request to core', function (onDone) {
    var names = {
      names: ['A layer named foo']
    };
    (0, _fixture.fixture)('simple_points.json').pipe(_request2['default'].post({
      url: url + ('/spatial?' + _querystring2['default'].stringify(names)),
      headers: {
        'Authorization': 'test-auth',
        'X-App-Token': 'app-token',
        'X-Socrata-Host': 'localhost:6668',
        'Content-Type': 'application/json'
      }
    })).on('response', function (response) {
      expect(response.statusCode).to.equal(200);
      var createRequest = _underscore2['default'].first(mockCore.history);
      expect(createRequest.body).to.eql({
        name: 'A layer named foo'
      });
      onDone();
    });
  });

  it('can put geojson and it will make a replace dataset request to core', function (onDone) {
    var names = {
      names: ['A new layer name']
    };
    (0, _fixture.fixture)('simple_points.json').pipe(_request2['default'].put({
      url: url + ('/spatial/qs32-qpt7?' + _querystring2['default'].stringify(names)),
      headers: {
        'Authorization': 'test-auth',
        'X-App-Token': 'app-token',
        'X-Socrata-Host': 'localhost:6668',
        'Content-Type': 'application/json'
      }
    })).on('response', function (response) {
      expect(response.statusCode).to.equal(200);

      var _mockCore$history = _slicedToArray(mockCore.history, 9);

      var replaceRequest = _mockCore$history[0];
      var getColReq = _mockCore$history[1];
      var delColReq0 = _mockCore$history[2];
      var delColReq1 = _mockCore$history[3];
      var geom = _mockCore$history[4];
      var aString = _mockCore$history[5];
      var aNum = _mockCore$history[6];
      var aFloat = _mockCore$history[7];
      var aBool = _mockCore$history[8];

      expect(replaceRequest.url).to.equal('/views/qs32-qpt7/publication?method=copySchema');
      expect(replaceRequest.method).to.equal('POST');

      expect(getColReq.url).to.equal('/views/qs32-qpt8/columns');
      expect(getColReq.method).to.equal('GET');

      expect(delColReq0.url).to.equal('/views/qs32-qpt8/columns/3415');
      expect(delColReq0.method).to.equal('DELETE');

      expect(delColReq1.url).to.equal('/views/qs32-qpt8/columns/3416');
      expect(delColReq1.method).to.equal('DELETE');

      expect(geom.body).to.eql({
        fieldName: "the_geom",
        name: "the_geom",
        dataTypeName: "point"
      });

      expect(aString.body).to.eql({
        fieldName: "a_string",
        name: "a_string",
        dataTypeName: "text"
      });

      expect(aNum.body).to.eql({
        fieldName: "a_num",
        name: "a_num",
        dataTypeName: "number"
      });

      expect(aFloat.body).to.eql({
        fieldName: "a_float",
        name: "a_float",
        dataTypeName: "number"
      });

      expect(aBool.body).to.eql({
        fieldName: "a_bool",
        name: "a_bool",
        dataTypeName: "checkbox"
      });

      onDone();
    });
  });

  it('can put geojson with no metadata replace dataset request to core', function (onDone) {
    (0, _fixture.fixture)('simple_points.json').pipe(_request2['default'].put({
      url: url + '/spatial/?',
      headers: {
        'Authorization': 'test-auth',
        'X-App-Token': 'app-token',
        'X-Socrata-Host': 'localhost:6668',
        'Content-Type': 'application/json'
      }
    })).on('response', function (response) {
      expect(response.statusCode).to.equal(200);

      var _mockCore$history2 = _slicedToArray(mockCore.history, 6);

      var createRequest = _mockCore$history2[0];
      var geom = _mockCore$history2[1];
      var aString = _mockCore$history2[2];
      var aNum = _mockCore$history2[3];
      var aFloat = _mockCore$history2[4];
      var aBool = _mockCore$history2[5];

      expect(createRequest.url).to.equal('/views?nbe=true');
      expect(createRequest.method).to.equal('POST');

      expect(geom.body).to.eql({
        fieldName: "the_geom",
        name: "the_geom",
        dataTypeName: "point"
      });

      expect(aString.body).to.eql({
        fieldName: "a_string",
        name: "a_string",
        dataTypeName: "text"
      });

      expect(aNum.body).to.eql({
        fieldName: "a_num",
        name: "a_num",
        dataTypeName: "number"
      });

      expect(aFloat.body).to.eql({
        fieldName: "a_float",
        name: "a_float",
        dataTypeName: "number"
      });

      expect(aBool.body).to.eql({
        fieldName: "a_bool",
        name: "a_bool",
        dataTypeName: "checkbox"
      });

      onDone();
    });
  });

  it('can put kml combo new and replace ids and it will make create and replace requests to core', function (onDone) {
    var names = {
      names: ['A new layer name']
    };
    (0, _fixture.fixture)('points_and_lines_multigeom.kml').pipe(_request2['default'].put({
      url: url + ('/spatial/qs32-qpt7,__empty__?' + _querystring2['default'].stringify(names)),
      headers: {
        'Authorization': 'test-auth',
        'X-App-Token': 'app-token',
        'X-Socrata-Host': 'localhost:6668',
        'Content-Type': 'application/vnd.google-earth.kml+xml'
      }
    })).on('response', function (response) {
      expect(response.statusCode).to.equal(200);

      var _mockCore$history3 = _slicedToArray(mockCore.history, 2);

      var replaceRequest = _mockCore$history3[0];
      var createRequest = _mockCore$history3[1];

      expect(replaceRequest.url).to.equal('/views/qs32-qpt7/publication?method=copySchema');
      expect(replaceRequest.method).to.equal('POST');

      expect(createRequest.url).to.equal('/views?nbe=true');

      onDone();
    });
  });

  it('can post kml and it will do an upsert to core', function (onDone) {
    (0, _fixture.bufferJs)((0, _fixture.fixture)('simple_points.kml').pipe(_request2['default'].post({
      url: url + '/spatial',
      headers: {
        'Authorization': 'test-auth',
        'X-App-Token': 'app-token',
        'X-Socrata-Host': 'localhost:6668',
        'Content-Type': 'application/vnd.google-earth.kml+xml'
      }
    })), function (resp, buffered) {
      expect(resp.statusCode).to.equal(200);
      expect(buffered.layers.length).to.equal(1);
      expect(buffered.layers[0].layer.count).to.equal(2);
      onDone();
    });
  });

  it('can post kmz points and it will do an upsert to core', function (onDone) {
    (0, _fixture.bufferJs)((0, _fixture.fixture)('simple_points.kmz').pipe(_request2['default'].post({
      url: url + '/spatial',
      encoding: null,
      binary: true,
      headers: {
        'Authorization': 'test-auth',
        'X-App-Token': 'app-token',
        'X-Socrata-Host': 'localhost:6668',
        'Content-Type': 'application/vnd.google-earth.kmz'
      }
    })), function (resp, buffered) {
      expect(resp.statusCode).to.equal(200);
      expect(buffered.layers.length).to.equal(1);
      expect(buffered.layers[0].layer.count).to.equal(2);
      expect(buffered.bbox).to.eql({
        minx: 102,
        miny: 0.5,
        maxx: 103,
        maxy: 1.5
      });
      onDone();
    });
  });

  it('can post geojson and it will make a create columns request to core', function (onDone) {
    (0, _fixture.bufferJs)((0, _fixture.fixture)('simple_points.json').pipe(_request2['default'].post({
      url: url + '/spatial',
      headers: {
        'Authorization': 'test-auth',
        'X-App-Token': 'app-token',
        'X-Socrata-Host': 'localhost:6668',
        'Content-Type': 'application/json'
      }
    })), function (resp, buffered) {
      var _mockCore$history$slice = mockCore.history.slice(1, 6);

      var _mockCore$history$slice2 = _slicedToArray(_mockCore$history$slice, 5);

      var geom = _mockCore$history$slice2[0];
      var aString = _mockCore$history$slice2[1];
      var aNum = _mockCore$history$slice2[2];
      var aFloat = _mockCore$history$slice2[3];
      var aBool = _mockCore$history$slice2[4];

      expect(geom.body).to.eql({
        fieldName: "the_geom",
        name: "the_geom",
        dataTypeName: "point"
      });

      expect(aString.body).to.eql({
        fieldName: "a_string",
        name: "a_string",
        dataTypeName: "text"
      });

      expect(aNum.body).to.eql({
        fieldName: "a_num",
        name: "a_num",
        dataTypeName: "number"
      });

      expect(aFloat.body).to.eql({
        fieldName: "a_float",
        name: "a_float",
        dataTypeName: "number"
      });

      expect(aBool.body).to.eql({
        fieldName: "a_bool",
        name: "a_bool",
        dataTypeName: "checkbox"
      });
      onDone();
    });
  });

  it('can post single layer and it will upsert to core', function (onDone) {
    var names = {
      names: ['Some Name', 'Another Name']
    };
    (0, _fixture.bufferJs)((0, _fixture.fixture)('simple_points.json').pipe(_request2['default'].post({
      url: url + ('/spatial?' + _querystring2['default'].stringify(names)),
      headers: {
        'Authorization': 'test-auth',
        'X-App-Token': 'app-token',
        'X-Socrata-Host': 'localhost:6668',
        'Content-Type': 'application/json'
      }
    })), function (resp, buffered) {
      var _mockCore$history$slice3 = mockCore.history.slice(6);

      var _mockCore$history$slice32 = _slicedToArray(_mockCore$history$slice3, 1);

      var upsert = _mockCore$history$slice32[0];

      expect(resp.statusCode).to.equal(200);

      expect(buffered).to.eql({
        'bbox': {
          "maxx": 103.0,
          "maxy": 1.5,
          "minx": 102.0,
          "miny": 0.5
        },
        'layers': [{
          'uid': 'qs32-qpt7',
          'layer': {
            "count": 2,
            "geometry": "point",
            "name": "Some Name",
            "columns": [{
              "dataTypeName": "point",
              "fieldName": "the_geom",
              "name": "the_geom"
            }, {
              "dataTypeName": "text",
              "fieldName": "a_string",
              "name": "a_string"
            }, {
              "dataTypeName": "number",
              "fieldName": "a_num",
              "name": "a_num"
            }, {
              "dataTypeName": "number",
              "fieldName": "a_float",
              "name": "a_float"
            }, {
              "dataTypeName": "checkbox",
              "fieldName": "a_bool",
              "name": "a_bool"
            }],

            "bbox": {
              "maxx": 103.0,
              "maxy": 1.5,
              "minx": 102.0,
              "miny": 0.5
            },
            "projection": "WGS 84"
          }
        }]
      });

      //check the request body that was actuall sent to core
      expect(JSON.parse(upsert.bufferedRows)).to.eql([{
        "the_geom": {
          "coordinates": [102, 0.5],
          "type": "Point"
        },
        "a_string": "first value",
        "a_num": 2,
        "a_float": 2.2,
        "a_bool": false
      }, {
        "the_geom": {
          "coordinates": [103, 1.5],
          "type": "Point"
        },
        "a_string": "second value",
        "a_num": 2,
        "a_float": 2.2,
        "a_bool": true
      }]);
      onDone();
    });
  });

  it('can post multi layer kml and it will upsert to core', function (onDone) {
    (0, _fixture.bufferJs)((0, _fixture.fixture)('points_and_lines_multigeom.kml').pipe(_request2['default'].post({
      url: url + '/spatial',
      headers: {
        'Authorization': 'test-auth',
        'X-App-Token': 'app-token',
        'X-Socrata-Host': 'localhost:6668',
        'Content-Type': 'application/vnd.google-earth.kml+xml'
      }
    })), function (resp, buffered) {
      var _buffered$layers = _slicedToArray(buffered.layers, 2);

      var mps = _buffered$layers[0].layer.geometry;
      var mls = _buffered$layers[1].layer.geometry;

      expect(mps).to.equal('multipoint');
      expect(mls).to.equal('multiline');
      expect(resp.statusCode).to.equal(200);

      onDone();
    });
  });

  it('will return a 503 when zk is dead', function (onDone) {
    mockZk.enableErrors();

    (0, _fixture.bufferJs)((0, _fixture.fixture)('simple_points.json').pipe(_request2['default'].post({
      url: url + '/spatial',
      headers: {
        'Authorization': 'test-auth',
        'X-App-Token': 'app-token',
        'X-Socrata-Host': 'localhost:6668',
        'Content-Type': 'application/json'
      }
    })), function (resp, buffered) {
      expect(resp.statusCode).to.equal(503);
      onDone();
    });
  });

  it('will return a 503 when core is dead', function (onDone) {
    mockCore.close();

    (0, _fixture.bufferJs)((0, _fixture.fixture)('simple_points.json').pipe(_request2['default'].post({
      url: url + '/spatial',
      headers: {
        'Authorization': 'test-auth',
        'X-App-Token': 'app-token',
        'X-Socrata-Host': 'localhost:6668',
        'Content-Type': 'application/json'
      }
    })), function (resp, buffered) {
      expect(resp.statusCode).to.equal(503);
      onDone();
    });
  });

  it('will return a 400 for a corrupt shapefile', function (onDone) {
    (0, _fixture.fixture)('corrupt_shapefile.zip').pipe(_request2['default'].post({
      url: url + '/spatial',
      headers: {
        'Authorization': 'test-auth',
        'X-App-Token': 'app-token',
        'X-Socrata-Host': 'localhost:6668',
        'Content-Type': 'application/json'
      }
    })).on('response', function (response) {
      expect(response.statusCode).to.equal(400);
      onDone();
    });
  });

  it('will delete any created layers when an error is encountered in column creation', function (onDone) {
    mockCore.failColumns = 503;
    (0, _fixture.bufferJs)((0, _fixture.fixture)('simple_points.json').pipe(_request2['default'].post({
      url: url + '/spatial',
      headers: {
        'Authorization': 'test-auth',
        'X-App-Token': 'app-token',
        'X-Socrata-Host': 'localhost:6668',
        'Content-Type': 'application/json'
      }
    })), function (resp, buffered) {
      var del = _underscore2['default'].last(mockCore.history);
      expect(del.method).to.equal('DELETE');
      expect(del.url).to.equal('/views/qs32-qpt7');
      mockCore.failColumns = false;
      onDone();
    });
  });

  it('will delete any created layers when an error is encountered getting column info', function (onDone) {
    mockCore.failGetColumns = 503;
    var names = {
      names: ['A new layer name']
    };
    (0, _fixture.bufferJs)((0, _fixture.fixture)('simple_points.json').pipe(_request2['default'].put({
      url: url + ('/spatial/qs32-qpt7?' + _querystring2['default'].stringify(names)),
      headers: {
        'Authorization': 'test-auth',
        'X-App-Token': 'app-token',
        'X-Socrata-Host': 'localhost:6668',
        'Content-Type': 'application/json'
      }
    })), function (resp, buffered) {
      mockCore.failGetColumns = false;
      var del0 = _underscore2['default'].last(mockCore.history);
      expect(del0.method).to.equal('DELETE');
      expect(del0.url).to.equal('/views/qs32-qpt8');
      onDone();
    });
  });

  it('will delete any created layers when an error is encountered in delete columns', function (onDone) {
    mockCore.failDeleteColumns = 503;
    var names = {
      names: ['A new layer name']
    };
    (0, _fixture.bufferJs)((0, _fixture.fixture)('simple_points.json').pipe(_request2['default'].put({
      url: url + ('/spatial/qs32-qpt7?' + _querystring2['default'].stringify(names)),
      headers: {
        'Authorization': 'test-auth',
        'X-App-Token': 'app-token',
        'X-Socrata-Host': 'localhost:6668',
        'Content-Type': 'application/json'
      }
    })), function (resp, buffered) {
      mockCore.failColumns = false;
      var del0 = _underscore2['default'].last(mockCore.history);
      expect(del0.method).to.equal('DELETE');
      expect(del0.url).to.equal('/views/qs32-qpt8');
      onDone();
    });
  });

  it('will delete any created layers when an error is encountered mid-upsert', function (onDone) {
    mockCore.failUpsert = 503;
    (0, _fixture.bufferJs)((0, _fixture.fixture)('simple_points.json').pipe(_request2['default'].post({
      url: url + '/spatial',
      headers: {
        'Authorization': 'test-auth',
        'X-App-Token': 'app-token',
        'X-Socrata-Host': 'localhost:6668',
        'Content-Type': 'application/json'
      }
    })), function (resp, buffered) {
      var del = _underscore2['default'].last(mockCore.history);
      expect(del.method).to.equal('DELETE');
      expect(del.url).to.equal('/views/qs32-qpt7');
      mockCore.failUpsert = false;
      onDone();
    });
  });
});