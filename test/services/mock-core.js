'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _underscore = require('underscore');

var _underscore2 = _interopRequireDefault(_underscore);

var _eventStream = require('event-stream');

var _eventStream2 = _interopRequireDefault(_eventStream);

var express = require('express');
var bodyParser = require('body-parser');

var CoreMock = (function () {
  function CoreMock(port) {
    _classCallCheck(this, CoreMock);

    this._history = [];
    this._colCounter = 0;

    var app = express();
    app.use(bodyParser.urlencoded({
      extended: true
    }));

    //this is super hacky....express binds middleware to the
    //base route, which overrides more specific routes, ugh
    app.use('/views/:fourfour/rows', bodyParser.raw());
    app.use(/\/views$/, bodyParser.json());
    app.use(/.*columns$/, bodyParser.json());

    app.post('/views/:uid/publication', (function (req, res) {
      this._history.push(req);
      var hs = req.headers;
      if (!hs.authorization || !hs['x-app-token'] || !hs['x-socrata-host']) {
        return res.status(400).send(JSON.stringify({
          error: 'headers'
        }));
      }

      var view = {
        "id": "qs32-qpt8",
        "name": req.body.name,
        "averageRating": 0,
        "createdAt": 1446152737,
        "downloadCount": 0,
        "newBackend": false,
        "numberOfComments": 0,
        "oid": 913,
        "publicationAppendEnabled": false,
        "publicationGroup": 971,
        "publicationStage": "unpublished",
        "tableId": 971,
        "totalTimesRated": 0,
        "viewCount": 0,
        "viewLastModified": 1446152737,
        "viewType": "tabular",
        "columns": [],
        "owner": {
          "id": "y6j7-unfr",
          "displayName": "wat",
          "emailUnsubscribed": false,
          "profileLastModified": 1437685194,
          "screenName": "wat",
          "rights": ["create_datasets", "edit_others_datasets", "edit_sdp", "edit_site_theme", "moderate_comments", "manage_users", "chown_datasets", "edit_nominations", "approve_nominations", "feature_items", "federations", "manage_stories", "manage_approval", "change_configurations", "view_domain", "view_others_datasets", "edit_pages", "create_pages", "view_goals", "view_dashboards", "edit_goals", "edit_dashboards", "create_dashboards"],
          "flags": ["admin"]
        },
        "query": {},
        "rights": ["read", "write", "add", "delete", "grant", "add_column", "remove_column", "update_column", "update_view", "delete_view"],
        "tableAuthor": {
          "id": "y6j7-unfr",
          "displayName": "wat",
          "emailUnsubscribed": false,
          "profileLastModified": 1437685194,
          "screenName": "wat",
          "rights": ["create_datasets", "edit_others_datasets", "edit_sdp", "edit_site_theme", "moderate_comments", "manage_users", "chown_datasets", "edit_nominations", "approve_nominations", "feature_items", "federations", "manage_stories", "manage_approval", "change_configurations", "view_domain", "view_others_datasets", "edit_pages", "create_pages", "view_goals", "view_dashboards", "edit_goals", "edit_dashboards", "create_dashboards"],
          "flags": ["admin"]
        },
        "flags": ["default"]
      };

      res.status(200).send(JSON.stringify(view));
    }).bind(this));

    app.post('/views', (function (req, res) {
      this._history.push(req);
      var hs = req.headers;
      if (!hs.authorization || !hs['x-app-token'] || !hs['x-socrata-host']) {
        return res.status(400).send(JSON.stringify({
          error: 'headers'
        }));
      }
      if (this.failCreate) {
        return res.status(this.failCreate).send('failCreate');
      }

      var view = {
        "id": "qs32-qpt7",
        "name": req.body.name,
        "averageRating": 0,
        "createdAt": 1446152737,
        "downloadCount": 0,
        "newBackend": false,
        "numberOfComments": 0,
        "oid": 913,
        "publicationAppendEnabled": false,
        "publicationGroup": 971,
        "publicationStage": "unpublished",
        "tableId": 971,
        "totalTimesRated": 0,
        "viewCount": 0,
        "viewLastModified": 1446152737,
        "viewType": "tabular",
        "columns": [],
        "owner": {
          "id": "y6j7-unfr",
          "displayName": "wat",
          "emailUnsubscribed": false,
          "profileLastModified": 1437685194,
          "screenName": "wat",
          "rights": ["create_datasets", "edit_others_datasets", "edit_sdp", "edit_site_theme", "moderate_comments", "manage_users", "chown_datasets", "edit_nominations", "approve_nominations", "feature_items", "federations", "manage_stories", "manage_approval", "change_configurations", "view_domain", "view_others_datasets", "edit_pages", "create_pages", "view_goals", "view_dashboards", "edit_goals", "edit_dashboards", "create_dashboards"],
          "flags": ["admin"]
        },
        "query": {},
        "rights": ["read", "write", "add", "delete", "grant", "add_column", "remove_column", "update_column", "update_view", "delete_view"],
        "tableAuthor": {
          "id": "y6j7-unfr",
          "displayName": "wat",
          "emailUnsubscribed": false,
          "profileLastModified": 1437685194,
          "screenName": "wat",
          "rights": ["create_datasets", "edit_others_datasets", "edit_sdp", "edit_site_theme", "moderate_comments", "manage_users", "chown_datasets", "edit_nominations", "approve_nominations", "feature_items", "federations", "manage_stories", "manage_approval", "change_configurations", "view_domain", "view_others_datasets", "edit_pages", "create_pages", "view_goals", "view_dashboards", "edit_goals", "edit_dashboards", "create_dashboards"],
          "flags": ["admin"]
        },
        "flags": ["default"]
      };

      res.status(200).send(JSON.stringify(view));
    }).bind(this));

    app.get('/views/:fourfour/columns', (function (req, res) {
      this._history.push(req);
      var hs = req.headers;
      if (!hs.authorization || !hs['x-app-token'] || !hs['x-socrata-host']) {
        return res.status(400).send('headers');
      }

      if (this.failGetColumns) {
        return res.status(this.failGetColumns).send('failGetColumns');
      }

      var view = _underscore2['default'].range(0, 2).map(function (i) {
        return {
          "id": 3415 + i,
          "position": i,
          "tableColumnId": 3415 + i,
          "format": {}
        };
      });

      res.status(200).send(JSON.stringify(view));
    }).bind(this));

    app['delete']('/views/:fourfour/columns/:colId', (function (req, res) {
      this._history.push(req);
      var hs = req.headers;
      if (!hs.authorization || !hs['x-app-token'] || !hs['x-socrata-host']) {
        return res.status(400).send('headers');
      }

      if (this.failDeleteColumns) {
        return res.status(this.failDeleteColumns).send('failDeleteColumns');
      }

      res.status(200).send(JSON.stringify({}));
    }).bind(this));

    app.post('/views/:fourfour/columns', (function (req, res) {
      this._history.push(req);
      var hs = req.headers;
      if (!hs.authorization || !hs['x-app-token'] || !hs['x-socrata-host']) {
        return res.status(400).send('headers');
      }

      if (!req.body.name || !req.body.dataTypeName || !req.body.fieldName) {
        return res.status(400).send('body');
      }

      if (this.failColumns) {
        return res.status(this.failColumns).send('failColumns');
      }

      var i = this.colCounter;
      var view = {
        "id": 3415 + i,
        "name": req.body.name,
        "dataTypeName": req.body.dataTypeName,
        "fieldName": req.body.fieldName,
        "position": i,
        "renderTypeName": req.body.dataTypeName,
        "tableColumnId": 3415 + i,
        "format": {}
      };

      res.status(200).send(JSON.stringify(view));
    }).bind(this));

    app['delete']('/views/:fourfour', (function (req, res) {
      this._history.push(req);
      res.status(200).send('{}');
    }).bind(this));

    app.post('/id/:fourfour', (function (req, res) {
      this._history.push(req);

      if (this.failUpsert) {
        return res.status(this.failUpsert).send('failUpsert');
      }

      req.bufferedRows = '';
      req.pipe(_eventStream2['default'].map(function (thing, cb) {
        req.bufferedRows += thing.toString('utf-8');
      }));

      req.on('end', function () {
        res.status(200).send('{}');
      });
    }).bind(this));

    this._app = app.listen(port);
  }

  _createClass(CoreMock, [{
    key: 'close',
    value: function close() {
      try {
        return this._app.close();
      } catch (e) {
        //already closed...heh
      }
    }
  }, {
    key: 'history',
    get: function get() {
      return this._history;
    }
  }, {
    key: 'colCounter',
    get: function get() {
      this._colCounter++;
      return this._colCounter;
    }
  }]);

  return CoreMock;
})();

exports['default'] = CoreMock;
module.exports = exports['default'];