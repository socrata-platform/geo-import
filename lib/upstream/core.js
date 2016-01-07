'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }; })();

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _request = require('request');

var _request2 = _interopRequireDefault(_request);

var _streamReduce = require('stream-reduce');

var _streamReduce2 = _interopRequireDefault(_streamReduce);

var _utilLogger = require('../util/logger');

var _utilLogger2 = _interopRequireDefault(_utilLogger);

var _decodersLayer = require('../decoders/layer');

var _decodersLayer2 = _interopRequireDefault(_decodersLayer);

var CoreAuth = (function () {
  function CoreAuth(request) {
    _classCallCheck(this, CoreAuth);

    this.req = request;
    this._headers = request.headers;
  }

  _createClass(CoreAuth, [{
    key: 'reqId',
    get: function get() {
      return this._headers['x-socrata-requestid'];
    }
  }, {
    key: 'authToken',
    get: function get() {
      return this._headers['authorization']; //jshint ignore:line
    }
  }, {
    key: 'appToken',
    get: function get() {
      return this._headers['x-app-token'];
    }
  }, {
    key: 'host',
    get: function get() {
      return this._headers['x-socrata-host'];
    }
  }, {
    key: 'cookie',
    get: function get() {
      return this._headers.cookie;
    }
  }]);

  return CoreAuth;
})();

var Core = (function () {
  function Core(auth, zookeeper) {
    _classCallCheck(this, Core);

    if (!auth || !zookeeper) throw new Error("Core-Client needs auth and zookeeper");
    this._auth = auth;
    this._zk = zookeeper;
  }

  _createClass(Core, [{
    key: '_url',
    value: function _url(cb) {
      return this._zk.getCore(cb);
    }
  }, {
    key: '_log',
    value: function _log(msg) {
      this._auth.req.log.info({ host: this._auth.host }, msg);
    }
  }, {
    key: '_headers',
    value: function _headers() {
      return {
        'Authorization': this._auth.authToken,
        'X-App-Token': this._auth.appToken,
        'X-Socrata-Host': this._auth.host,
        'X-Socrata-RequestId': this._auth.reqId,
        'Cookie': this._auth.cookie,
        'Content-Type': 'application/json'
      };
    }

    //partial to buffer a response
  }, {
    key: 'bufferResponse',
    value: function bufferResponse(onBuffered) {
      return function (response) {
        if (!response.pipe) {
          //this is so gross.
          //the error even will emit both error responses
          //(shouldn't 'response' do that?) as well as regular
          //errors. why? because. so this case handles a "response"
          //which is not actually a response, but something like
          //a failure to open a connection
          //so we munge the error to resemble an upstream
          //response error
          return onBuffered({
            body: response.code,
            statusCode: 503
          });
        }

        response.pipe((0, _streamReduce2['default'])(function (acc, data) {
          return acc + data.toString('utf-8');
        }, '')).on('data', function (buf) {
          try {
            response.body = JSON.parse(buf);
          } catch (e) {
            response.body = buf;
          }
          onBuffered(response);
        });
      };
    }
  }, {
    key: '_onResponseStart',
    value: function _onResponseStart(onComplete) {
      return this.bufferResponse(function (response) {
        if (response.statusCode > 300) return onComplete(response);
        return onComplete(false, response);
      });
    }
  }, {
    key: '_onErrorResponse',
    value: function _onErrorResponse(onComplete) {
      return this.bufferResponse(function (response) {
        return onComplete(response, false);
      });
    }
  }, {
    key: 'destroy',
    value: function destroy(layer, onComplete) {
      var _this = this;

      return this._url(function (err, url) {
        if (err) return onComplete(err);
        _this._log('DeleteDataset');
        _request2['default'].del({
          url: url + '/views/' + layer.uid,
          headers: _this._headers(),
          json: true
        }).on('response', _this._onResponseStart(onComplete)).on('error', _this._onErrorResponse(onComplete));
      });
    }
  }, {
    key: 'create',
    value: function create(layer, onComplete) {
      var _this2 = this;

      if (layer.uid !== _decodersLayer2['default'].EMPTY) {
        _utilLogger2['default'].warn('Layer uid is not empty, layer uid is ' + layer.uid + ', cannot create layer in datastore!');
      }
      return this._url(function (err, url) {
        if (err) return onComplete(err);

        _this2._log('CreateDataset request to core');
        _request2['default'].post({
          url: url + '/views?nbe=true',
          headers: _this2._headers(),
          body: {
            name: layer.name
          },
          json: true
        }).on('response', _this2._onResponseStart(onComplete)).on('error', _this2._onErrorResponse(onComplete));
      });
    }
  }, {
    key: 'replace',
    value: function replace(layer, onComplete) {
      var _this3 = this;

      return this._url(function (err, url) {
        if (err) return onComplete(err);

        _this3._log('CopySchema request for new layer to core');
        _request2['default'].post({
          url: url + '/views/' + layer.uid + '/publication?method=copySchema',
          headers: _this3._headers()
        }).on('response', _this3._onResponseStart(onComplete)).on('error', _this3._onErrorResponse(onComplete));
      });
    }
  }, {
    key: 'addColumn',
    value: function addColumn(colSpec, onComplete) {
      var _this4 = this;

      var _colSpec = _slicedToArray(colSpec, 2);

      var fourfour = _colSpec[0];
      var column = _colSpec[1];

      this._log('Add column ' + fourfour + ' ' + JSON.stringify(column.toJSON()) + ' to core');

      return this._url(function (err, url) {
        if (err) return onComplete(err);

        return _request2['default'].post({
          url: url + '/views/' + fourfour + '/columns',
          headers: _this4._headers(),
          body: column.toJSON(),
          json: true
        }).on('response', _this4._onResponseStart(onComplete)).on('error', _this4._onErrorResponse(onComplete));
      });
    }
  }, {
    key: 'getColumns',
    value: function getColumns(layer, onComplete) {
      var _this5 = this;

      return this._url(function (err, url) {
        if (err) return onComplete(err);

        return _request2['default'].get({
          url: url + '/views/' + layer.uid + '/columns',
          headers: _this5._headers()
        }).on('response', _this5._onResponseStart(onComplete)).on('error', _this5._onErrorResponse(onComplete));
      });
    }
  }, {
    key: 'deleteColumn',
    value: function deleteColumn(colSpec, onComplete) {
      var _this6 = this;

      var _colSpec2 = _slicedToArray(colSpec, 2);

      var viewId = _colSpec2[0];
      var colId = _colSpec2[1];

      this._log('Delete column ' + viewId + ' ' + colId + ' from core');

      return this._url(function (err, url) {
        if (err) return onComplete(err);

        return _request2['default'].del({
          url: url + '/views/' + viewId + '/columns/' + colId,
          headers: _this6._headers()
        }).on('response', _this6._onResponseStart(onComplete)).on('error', _this6._onErrorResponse(onComplete));
      });
    }
  }, {
    key: 'upsert',
    value: function upsert(layer, onOpened) {
      var _this7 = this;

      this._log('Upsert to core ' + layer.uid);
      return this._url(function (err, url) {
        if (err) return onOpened(err);

        var upsertOpener = function upsertOpener() {
          return _request2['default'].post({
            url: url + '/id/' + layer.uid + '.json',
            headers: _this7._headers()
          });
        };
        return onOpened(false, [layer, upsertOpener]);
      });
    }
  }]);

  return Core;
})();

exports.Core = Core;
exports.CoreAuth = CoreAuth;