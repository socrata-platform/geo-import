import _ from 'underscore';
import chai from 'chai';
import should from 'should';
import * as es from 'event-stream';
import {
  fixture, bufferJs
}
from '../fixture';
import request from 'request';
import CoreMock from '../services/mock-core';
import MockZKClient from '../services/mock-zk';
import {
  EventEmitter
}
from 'events';
import config from '../../lib/config';
import service from '../../lib/service';
import qs from 'querystring';

var expect = chai.expect;

describe('spatial service', function() {
  var mockZk;
  var mockCore;
  var conf = config();
  var corePort = 7001; //coreport
  var url = `http://localhost:${conf.port}`;
  var app;

  beforeEach((onDone) => {
    mockZk = new MockZKClient(corePort);
    service(mockZk, {}, (a, zk) => {
      app = a;
      mockCore = new CoreMock(corePort);
      onDone();
    });
  });

  afterEach(function() {
    mockCore.close();
    app.close();
  });


  it('can post geojson and it will make a create dataset request to core', function(onDone) {
    var names = {
      names: ['A layer named foo']
    };
    fixture('simple_points.json')
      .pipe(request.post({
        url: url + `/spatial?${qs.stringify(names)}`,
        headers: {
          'Authorization': 'test-auth',
          'X-App-Token': 'app-token',
          'X-Socrata-Host': 'localhost:6668',
          'Content-Type': 'application/json'
        }
      }))
      .on('response', function(response) {
        expect(response.statusCode).to.equal(200);
        var createRequest = _.first(mockCore.history);
        expect(createRequest.body).to.eql({
          name: 'A layer named foo'
        });
        onDone();
      });
  });

  it('can put geojson and it will make a replace dataset request to core', function(onDone) {
    var names = {
      names: ['A new layer name']
    };
    fixture('simple_points.json')
      .pipe(request.put({
        url: url + `/spatial/qs32-qpt7?${qs.stringify(names)}`,
        headers: {
          'Authorization': 'test-auth',
          'X-App-Token': 'app-token',
          'X-Socrata-Host': 'localhost:6668',
          'Content-Type': 'application/json'
        }
      }))
      .on('response', function(response) {
        expect(response.statusCode).to.equal(200);
        var [replaceRequest, getColReq, delColReq0, delColReq1, geom, aString, aNum, aFloat, aBool] = mockCore.history;
        expect(replaceRequest.url).to.equal(
          '/views/qs32-qpt7/publication?method=copySchema'
        )
        expect(replaceRequest.method).to.equal('POST');

        expect(getColReq.url).to.equal(
          '/views/qs32-qpt8/columns'
        )
        expect(getColReq.method).to.equal('GET')

        expect(delColReq0.url).to.equal(
          '/views/qs32-qpt8/columns/3415'
        )
        expect(delColReq0.method).to.equal('DELETE')

        expect(delColReq1.url).to.equal(
          '/views/qs32-qpt8/columns/3416'
        )
        expect(delColReq1.method).to.equal('DELETE')

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

  it('can put geojson combo new and replace ids and it will make create and replace requests to core', function(onDone) {
    var names = {
      names: ['A new layer name']
    };
    fixture('points_and_lines_multigeom.kml')
      .pipe(request.put({
        url: url + `/spatial/qs32-qpt7,__empty__?${qs.stringify(names)}`,
        headers: {
          'Authorization': 'test-auth',
          'X-App-Token': 'app-token',
          'X-Socrata-Host': 'localhost:6668',
          'Content-Type': 'application/vnd.google-earth.kml+xml'
        }
      }))
      .on('response', function(response) {
        expect(response.statusCode).to.equal(200);

        var [replaceRequest, createRequest] = mockCore.history;

        expect(replaceRequest.url).to.equal(
          '/views/qs32-qpt7/publication?method=copySchema'
        )
        expect(replaceRequest.method).to.equal('POST');

        expect(createRequest.url).to.equal(
          '/views?nbe=true'
        )

        onDone();
      });
  });



  it('can post kml and it will do an upsert to core', function(onDone) {
    bufferJs(fixture('simple_points.kml')
      .pipe(request.post({
        url: url + '/spatial',
        headers: {
          'Authorization': 'test-auth',
          'X-App-Token': 'app-token',
          'X-Socrata-Host': 'localhost:6668',
          'Content-Type': 'application/vnd.google-earth.kml+xml'
        }
      })), (resp, buffered) => {
        expect(resp.statusCode).to.equal(200);
        expect(buffered.layers.length).to.equal(1);
        expect(buffered.layers[0].layer.count).to.equal(2);
        onDone();
      });
  });

  it('can post kmz points and it will do an upsert to core', function(onDone) {
    bufferJs(fixture('simple_points.kmz')
      .pipe(request.post({
        url: url + '/spatial',
        encoding: null,
        binary: true,
        headers: {
          'Authorization': 'test-auth',
          'X-App-Token': 'app-token',
          'X-Socrata-Host': 'localhost:6668',
          'Content-Type': 'application/vnd.google-earth.kmz',
        }
      })), (resp, buffered) => {
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


  it('can post geojson and it will make a create columns request to core', function(onDone) {
    bufferJs(fixture('simple_points.json')
      .pipe(request.post({
        url: url + '/spatial',
        headers: {
          'Authorization': 'test-auth',
          'X-App-Token': 'app-token',
          'X-Socrata-Host': 'localhost:6668',
          'Content-Type': 'application/json'
        }
      })), (resp, buffered) => {

        var [geom, aString, aNum, aFloat, aBool] = mockCore.history.slice(1, 6);

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

  it('can post single layer and it will upsert to core', function(onDone) {
    var names = {
      names: ['Some Name', 'Another Name']
    };
    bufferJs(fixture('simple_points.json')
      .pipe(request.post({
        url: url + `/spatial?${qs.stringify(names)}`,
        headers: {
          'Authorization': 'test-auth',
          'X-App-Token': 'app-token',
          'X-Socrata-Host': 'localhost:6668',
          'Content-Type': 'application/json'
        }
      })), (resp, buffered) => {
        var [upsert] = mockCore.history.slice(6);
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
        expect(JSON.parse(upsert.bufferedRows)).to.eql(
          [{
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
          }]
        );
        onDone();
      });
  });


  it('can post multi layer and it will upsert to core', function(onDone) {
    bufferJs(fixture('points_and_lines_multigeom.kml')
      .pipe(request.post({
        url: url + '/spatial',
        headers: {
          'Authorization': 'test-auth',
          'X-App-Token': 'app-token',
          'X-Socrata-Host': 'localhost:6668',
          'Content-Type': 'application/vnd.google-earth.kml+xml'
        }
      })), (resp, buffered) => {
        var [{
          layer: {
            geometry: mps
          }
        }, {
          layer: {
            geometry: mls
          }
        }] = buffered.layers;

        expect(mps).to.equal('multipoint');
        expect(mls).to.equal('multiline');
        expect(resp.statusCode).to.equal(200);

        onDone();
      });
  });


  it('will return a 503 when zk is dead', function(onDone) {
    mockZk.enableErrors();

    bufferJs(fixture('simple_points.json')
      .pipe(request.post({
        url: url + '/spatial',
        headers: {
          'Authorization': 'test-auth',
          'X-App-Token': 'app-token',
          'X-Socrata-Host': 'localhost:6668',
          'Content-Type': 'application/json'
        }
      })), (resp, buffered) => {
        expect(resp.statusCode).to.equal(503);
        onDone();
      });
  });


  it('will return a 503 when core is dead', function(onDone) {
    mockCore.close();

    bufferJs(fixture('simple_points.json')
      .pipe(request.post({
        url: url + '/spatial',
        headers: {
          'Authorization': 'test-auth',
          'X-App-Token': 'app-token',
          'X-Socrata-Host': 'localhost:6668',
          'Content-Type': 'application/json'
        }
      })), (resp, buffered) => {
        expect(resp.statusCode).to.equal(503);
        onDone();
      });
  });


  it('will return a 400 for a corrupt shapefile', function(onDone) {
    fixture('corrupt_shapefile.zip')
      .pipe(request.post({
        url: url + '/spatial',
        headers: {
          'Authorization': 'test-auth',
          'X-App-Token': 'app-token',
          'X-Socrata-Host': 'localhost:6668',
          'Content-Type': 'application/json'
        }
      }))
      .on('response', function(response) {
        expect(response.statusCode).to.equal(400);
        onDone();
      });
  });

  it('will delete any created layers when an error is encountered in column creation', function(onDone) {
    mockCore.failColumns = 503;
    bufferJs(fixture('simple_points.json')
      .pipe(request.post({
        url: url + '/spatial',
        headers: {
          'Authorization': 'test-auth',
          'X-App-Token': 'app-token',
          'X-Socrata-Host': 'localhost:6668',
          'Content-Type': 'application/json'
        }
      })), (resp, buffered) => {
        var del = _.last(mockCore.history);
        expect(del.method).to.equal('DELETE')
        expect(del.url).to.equal('/views/qs32-qpt7')
        mockCore.failColumns = false;
        onDone();
      });
  });


  it('will delete any created layers when an error is encountered getting column info', function(onDone) {
    mockCore.failGetColumns = 503;
    var names = {
      names: ['A new layer name']
    };
    bufferJs(
      fixture('simple_points.json')
      .pipe(request.put({
        url: url + `/spatial/qs32-qpt7?${qs.stringify(names)}`,
        headers: {
          'Authorization': 'test-auth',
          'X-App-Token': 'app-token',
          'X-Socrata-Host': 'localhost:6668',
          'Content-Type': 'application/json'
        }
      })), (resp, buffered) => {
        mockCore.failGetColumns = false;
        var del0 = _.last(mockCore.history);
        expect(del0.method).to.equal('DELETE')
        expect(del0.url).to.equal('/views/qs32-qpt8')
        onDone();
      });
  });


  it('will delete any created layers when an error is encountered in delete columns', function(onDone) {
    mockCore.failDeleteColumns = 503;
    var names = {
      names: ['A new layer name']
    };
    bufferJs(
      fixture('simple_points.json')
      .pipe(request.put({
        url: url + `/spatial/qs32-qpt7?${qs.stringify(names)}`,
        headers: {
          'Authorization': 'test-auth',
          'X-App-Token': 'app-token',
          'X-Socrata-Host': 'localhost:6668',
          'Content-Type': 'application/json'
        }
      })), (resp, buffered) => {
        mockCore.failColumns = false;
        var del0 = _.last(mockCore.history);
        expect(del0.method).to.equal('DELETE')
        expect(del0.url).to.equal('/views/qs32-qpt8')
        onDone();
      });
  });

  it('will delete any created layers when an error is encountered mid-upsert', function(onDone) {
    mockCore.failUpsert = 503;
    bufferJs(fixture('simple_points.json')
      .pipe(request.post({
        url: url + '/spatial',
        headers: {
          'Authorization': 'test-auth',
          'X-App-Token': 'app-token',
          'X-Socrata-Host': 'localhost:6668',
          'Content-Type': 'application/json'
        }
      })), (resp, buffered) => {
        var del = _.last(mockCore.history);
        expect(del.method).to.equal('DELETE')
        expect(del.url).to.equal('/views/qs32-qpt7')
        mockCore.failUpsert = false;
        onDone();
      });
  });
});