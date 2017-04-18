var express = require('express');
var bodyParser = require('body-parser');
import path from 'path';
import _ from 'underscore';
import es from 'event-stream';

function hasHeaders(req, res) {
  const present = _.every(['x-socrata-requestid', 'x-socrata-host'], (key) => {
    return !_.isUndefined(req.headers[key]) && (req.headers[key] !== 'null');
  })
  if (!present) {
    res.status(400).send(JSON.stringify({
      error: 'headers'
    }));
  }
  return present
}



function enforceUA(req, res, next) {
  if (req.headers['user-agent'] !== 'geo-import') {
    res.status(400).send(JSON.stringify({
      error: 'user-agent invalid'
    }));
  }
  next();
}

const view = (name) => ({
  "id": "qs32-qpt7",
  "name": name,
  "averageRating": 0,
  "blobId": "qs32-blob-id",
  "blobFilename": "foo.zip",
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
  "privateMetadata": {
    "foo": "bar"
  },
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
})

class CoreMock {
  constructor(port) {
    this._history = [];
    this._colCounter = 0;

    var app = express();
    app.use(bodyParser.urlencoded({
      extended: true
    }));

    //this is super hacky....express binds middleware to the
    //base route, which overrides more specific routes, ugh
    app.use('/views/:fourfour/rows', enforceUA, bodyParser.raw());
    app.use(/\/views$/, enforceUA, bodyParser.json());
    app.use(/.*columns$/, enforceUA, bodyParser.json());

    app.post('/authenticate', (req, res) => {
      this._history.push(req);
      return res.status(200)
        .header('set-cookie', 'monster')
        .send('ok')
    })

    app.post('/views/:uid/publication', function(req, res) {
      this._history.push(req);
      const valid = hasHeaders(req, res);
      if (!valid) return;

      if (req.query.method !== 'copySchema' && this.failPublication) {
        return res.status(this.failPublication).send('failColumns');
      }

      if (req.query.method === 'copySchema' && this.failWorkingCopy) {
        return res.status(this.failWorkingCopy).send('failColumns');
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
    }.bind(this));

    app.post('/views', function(req, res) {
      this._history.push(req);
      const valid = hasHeaders(req, res);
      if (!valid) return;

      if (this.failCreate) {
        return res.status(this.failCreate).send('failCreate');
      }

      res.status(200).send(JSON.stringify(view(req.body.name)));
    }.bind(this));

    app.get('/views/:fourfour/columns', function(req, res) {
      this._history.push(req);
      const valid = hasHeaders(req, res);
      if (!valid) return;

      if (this.failGetColumns) {
        return res.status(this.failGetColumns).send('failGetColumns');
      }

      var view = _.range(0, 2).map((i) => {
        return {
          "id": 3415 + i,
          "position": i,
          "tableColumnId": 3415 + i,
          "format": {}
        };
      });


      res.status(200).send(JSON.stringify(view));
    }.bind(this));

    app.get('/views/:fourfour', function(req, res) {
      this._history.push(req);
      const valid = hasHeaders(req, res);
      if (!valid) return;
      res.status(200).send(JSON.stringify(view("foo")));
    }.bind(this));

    app.delete('/views/:fourfour/columns/:colId', function(req, res) {
      this._history.push(req);
      const valid = hasHeaders(req, res);
      if (!valid) return;

      if (this.failDeleteColumns) {
        return res.status(this.failDeleteColumns).send('failDeleteColumns');
      }

      res.status(200).send(JSON.stringify({}));
    }.bind(this));

    app.post('/views/:fourfour/columns', function(req, res) {
      this._history.push(req);
      const valid = hasHeaders(req, res);
      if (!valid) return;

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
    }.bind(this));

    app.delete('/views/:fourfour', function(req, res) {
      this._history.push(req);
      res.status(200).send('{}');
    }.bind(this));

    app.put('/views/:fourfour', function(req, res) {
      this._history.push(req);

      if (this.failSetBlob && req.query.method === 'setBlob') {
        return res.status(this.failSetBlob).send('failSetBlob');
      }

      req.bufferedRows = '';
      req.pipe(es.map((thing, cb) => {
        req.bufferedRows += thing.toString('utf-8');
      }));

      req.on('end', () => {
        res.status(200).send(req.bufferedRows);
      });
    }.bind(this));

    app.post('/id/:fourfour', function(req, res) {
      this._history.push(req);

      if (this.failUpsert) {
        return res.status(this.failUpsert).send('failUpsert');
      }

      req.bufferedRows = '';
      req.pipe(es.map((thing, cb) => {
        req.bufferedRows += thing.toString('utf-8');
      }));

      req.on('end', () => {
        res.status(200).send('{}');
      });
    }.bind(this));

    app.get('/file_data/:blobId', (req, res) => {
      const absPath = path.resolve(`${__dirname}/../fixtures/${req.params.blobId}`);
      res.sendFile(absPath);
    });

    app.put('/id/:fourfour', function(req, res) {
      this._history.push(req);

      if (this.failUpsert) {
        return res.status(this.failUpsert).send('failUpsert');
      }

      req.bufferedRows = '';
      req.pipe(es.map((thing, cb) => {
        req.bufferedRows += thing.toString('utf-8');
      }));

      req.on('end', () => {
        res.status(200).send('{}');
      });
    }.bind(this));

    this._app = app.listen(port);
  }

  get history() {
    return this._history;
  }

  clear() {
    this._history = [];
  }

  get colCounter() {
    this._colCounter++;
    return this._colCounter;
  }

  close() {
    try {
      return this._app.close();
    } catch (e) {
      //already closed...heh
    }
  }


}



export
default CoreMock;
