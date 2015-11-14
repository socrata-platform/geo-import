import _ from 'underscore';
import chai from 'chai';
import should from 'should';
import * as es from 'event-stream';
import {
  fixture, bufferJs
}
from './fixture';
import request from 'request';
import CoreMock from './services/mock-core';
import MockZKClient from './services/mock-zk';
import {
  EventEmitter
}
from 'events';
import config from '../lib/config';
import service from '../lib/service';

var expect = chai.expect;

describe('unit :: spatial service', function() {
  var app;
  var mockZk;
  var mockCore;
  var port = config().port;
  var url = `http://localhost:${port}`;

  beforeEach(function(onDone) {
    service({
      zkClient: MockZKClient
    }, (a, zk) => {
      mockZk = zk;
      app = a;
      mockCore = new CoreMock(mockZk.corePort);
      onDone();
    });
  });

  afterEach(function() {
    mockCore.close();
    app.close();
  });


  it('can post geojson and it will make a create dataset request to core', function(onDone) {
    fixture('simple_points.json')
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
        var createRequest = _.first(mockCore.history);
        expect(createRequest.body).to.eql({
          name: 'layer_0'
        });
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


  //;_;
  //So the request library doesn't work in a reasonable way and keeps posting
  //data as non-binary, despite the fact that the stream is opened as binary?
  //so this results in a corrupt file on the other end.
  //this works via curl, so the problem is on the test side with the posting
  //of the fixture, rather than in express. GAH
  // it('can post kmz points and it will do an upsert to core', function(onDone) {
  //   bufferJs(fixture('simple_points.kmz')
  //     .pipe(request.post({
  //       url: url + '/spatial',
  //       encoding: null,
  //       binary: true,
  //       headers: {
  //         'Authorization': 'test-auth',
  //         'X-App-Token': 'app-token',
  //         'X-Socrata-Host': 'localhost:6668',
  //         'Content-Type': 'application/vnd.google-earth.kmz',
  //       }
  //     })), (resp, buffered) => {
  //       expect(resp.statusCode).to.equal(200);
  //       expect(buffered.layers.length).to.equal(1);
  //       expect(buffered.layers[0].created).to.equal(2);
  //       onDone();
  //     });
  // });


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
              "name": "layer_0",
              "bbox": {
                "maxx": 103.0,
                "maxy": 1.5,
                "minx": 102.0,
                "miny": 0.5
              },
              "projection": "GEOGCS[\"WGS 84\",\n    DATUM[\"WGS_1984\",\n        SPHEROID[\"WGS 84\",6378137,298.257223563,\n            AUTHORITY[\"EPSG\",\"7030\"]],\n        TOWGS84[0,0,0,0,0,0,0],\n        AUTHORITY[\"EPSG\",\"6326\"]],\n    PRIMEM[\"Greenwich\",0,\n        AUTHORITY[\"EPSG\",\"8901\"]],\n    UNIT[\"degree\",0.0174532925199433,\n        AUTHORITY[\"EPSG\",\"9108\"]],\n    AUTHORITY[\"EPSG\",\"4326\"]]"
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
});