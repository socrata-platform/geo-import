var express = require('express');
var bodyParser = require('body-parser');
import es from 'event-stream' ;

var a;
class CoreMock {
  constructor(port) {
    this._history = [];
    this._colCounter = 0;

    var core = express();
    core.use(bodyParser.urlencoded({
      extended: true
    }));

    //this is super hacky....express binds middleware to the
    //base route, which overrides more specific routes, ugh
    core.use('/views/:fourfour/rows', bodyParser.raw());
    core.use(/\/views$/, bodyParser.json());
    core.use(/.*columns$/, bodyParser.json());

    core.post('/views', function(req, res) {
      this._history.push(req);
      var hs = req.headers;
      if (!hs.authorization || !hs['x-app-token'] || !hs['x-socrata-host']) {
        return res.status(400).send(JSON.stringify({error: 'headers'}));
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
    }.bind(this));

    core.post('/views/:fourfour/columns', function(req, res) {
      this._history.push(req);
      var hs = req.headers;
      if (!hs.authorization || !hs['x-app-token'] || !hs['x-socrata-host']) {
        return res.status(400).send('headers');
      }

      if(!req.body.name || !req.body.dataTypeName || !req.body.fieldName) {
        return res.status(400).send('body');
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

    core.post('/id/:fourfour', function(req, res) {
      this._history.push(req);

      req.bufferedRows = '';
      req.pipe(es.map((thing, cb) => {
        req.bufferedRows += thing.toString('utf-8');
      }))
      req.on('end', () => {
        res.status(200).send('{}');
      })
    }.bind(this));

    console.log("CORE BINDING TO PORT", port);
    a = core.listen(port);
  }

  get history() {
    return this._history;
  }

  get colCounter() {
    this._colCounter++;
    return this._colCounter;
  }

  close() {
    a.close();
  }


}



export default CoreMock;