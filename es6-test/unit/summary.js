import _ from 'underscore';
import chai from 'chai';
import should from 'should';
import * as es from 'event-stream';
import fs from 'fs';
import {
  fixture, bufferJs
}
from '../fixture';
import request from 'request';
import MockZKClient from '../services/mock-zk';
import {
  EventEmitter
}
from 'events';
import config from '../../lib/config';
import service from '../../lib/service';

var expect = chai.expect;

describe('summary service', () => {
  var app;
  var port = config().port;
  var url = `http://localhost:${port}`;
  var corePort = 7000;

  beforeEach((onDone) => {
    var zk = new MockZKClient(corePort);
    service(zk, {}, (a, zk) => {
      app = a;
      onDone();
    });
  });

  afterEach(() => app.close());

  var sizeOf = function(fname) {
    return fs.statSync(__dirname + '/../fixtures/' + fname).size;
  };


  it('can make a summary error for incomplete shape archives', (onDone) => {
    var fx = 'missing_dbf.zip';
    bufferJs(fixture(fx)
      .pipe(request.post({
        url: url + '/summary',
        headers: {
          'Authorization': 'test-auth',
          'X-App-Token': 'app-token',
          'X-Socrata-Host': 'localhost:6668',
          'Content-Type': 'application/zip',
          'Content-Length': sizeOf(fx),
          'X-Blob-Length': sizeOf(fx)
        }
      })).on('error', () => {}), (res, buffered) => {
        expect(buffered).to.eql({
          error: {
            reason: 'incomplete_shapefile_error',
            english: 'Your shapefile archive is incomplete. It must contain a .dbf, .shp, and .prj file for every layer. Expected it to contain the following files, which were actually missing: SIGNIFICANT_ECOLOGICAL_AREA_(SEA).dbf.',
            params: {
              missing: 'SIGNIFICANT_ECOLOGICAL_AREA_(SEA).dbf'
            }
          }
        });
        onDone();
      });
  });

  it('can make a summary error for corrupt shape archives', (onDone) => {
    var fx = 'corrupt_shapefile.zip';
    bufferJs(fixture(fx)
      .pipe(request.post({
        url: url + '/summary',
        headers: {
          'Authorization': 'test-auth',
          'X-App-Token': 'app-token',
          'X-Socrata-Host': 'localhost:6668',
          'Content-Type': 'application/zip',
          'Content-Length': sizeOf(fx),
          'X-Blob-Length': sizeOf(fx)
        }
      })).on('error', () => {}), (res, buffered) => {
        expect(buffered).to.eql({
          error: {
            reason: 'corrupt_shapefile_error',
            english: 'Failed to read the shapefile: Error: unsupported shape type: 16473',
            params: {
              reason: 'Error: unsupported shape type: 16473'
            }
          }
        });
        onDone();
      });
  });

  it('can make an abbreviated summary for large geojsons', (onDone) => {
    var fx = 'simple_points_large.json';
    bufferJs(fixture(fx)
      .pipe(request.post({
        url: url + '/summary',
        headers: {
          'Authorization': 'test-auth',
          'X-App-Token': 'app-token',
          'X-Socrata-Host': 'localhost:6668',
          'Content-Type': 'application/json',
          'Content-Length': sizeOf(fx),
          'X-Blob-Length': sizeOf(fx)
        }
      })).on('error', () => {}), (res, buffered) => {
        expect(res.statusCode).to.equal(200);
        expect(res.headers['content-type']).to.contain('application/json');
        expect(buffered.layers).to.eql([]);
        onDone();
      });
  });


  it('can make an abbreviated summary for large kmls', function(onDone) {
    //for jankins
    this.timeout(6000);
    var fx = 'usbr_gt_50k.kml';
    bufferJs(fixture(fx)
      .pipe(request.post({
        url: url + '/summary',
        headers: {
          'Authorization': 'test-auth',
          'X-App-Token': 'app-token',
          'X-Socrata-Host': 'localhost:6668',
          'Content-Type': 'application/vnd.google-earth.kml+xml',
          'Content-Length': sizeOf(fx),
          'X-Blob-Length': sizeOf(fx)
        }
      })).on('error', () => {}), (res, buffered) => {
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

  it('can make an abbreviated summary for large kmzs', function(onDone) {
    //for jankins
    this.timeout(8000);

    var fx = 'usbr_gt_50k.kmz';
    bufferJs(fixture(fx)
      .pipe(request.post({
        url: url + '/summary',
        headers: {
          'Authorization': 'test-auth',
          'X-App-Token': 'app-token',
          'X-Socrata-Host': 'localhost:6668',
          'Content-Type': 'application/vnd.google-earth.kmz',
          'Content-Length': sizeOf(fx),
          'X-Blob-Length': sizeOf(fx)
        }
      })).on('error', () => {}), (res, buffered) => {
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

  it('can make an full summary for large shapefiles above the limit', function(onDone) {
    //for jankins
    this.timeout(18000);

    var fx = 'wards_gt_50k.zip';
    bufferJs(fixture(fx)
      .pipe(request.post({
        url: url + '/summary',
        headers: {
          'Authorization': 'test-auth',
          'X-App-Token': 'app-token',
          'X-Socrata-Host': 'localhost:6668',
          'Content-Type': 'application/zip',
          'Content-Length': sizeOf(fx),
          'X-Blob-Length': sizeOf(fx)
        }
      })), (res, buffered) => {
        expect(res.statusCode).to.equal(200);
        expect(res.headers['content-type']).to.contain('application/json');
        expect(buffered.layers).to.eql([{
          "bbox": {
            "maxx": null,
            "maxy": null,
            "minx": null,
            "miny": null,
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

  it('can post single layer geojson and it will make a summary', (onDone) => {
    var fx = 'simple_points.json';
    bufferJs(fixture(fx)
      .pipe(request.post({
        url: url + '/summary',
        headers: {
          'Authorization': 'test-auth',
          'X-App-Token': 'app-token',
          'X-Socrata-Host': 'localhost:6668',
          'Content-Type': 'application/json',
          'Content-Length': sizeOf(fx),
          'X-Blob-Length': sizeOf(fx)
        }
      })), (res, buffered) => {
        expect(res.statusCode).to.equal(200);
        expect(res.headers['content-type']).to.contain('application/json');
        var [layer] = buffered.layers;
        expect(layer.projection).to.equal('WGS 84');
        expect(layer.name).to.equal('layer_0');
        onDone();
      });
  });

  it('can post multi layer geojson and it will make a summary', (onDone) => {
    var fx = 'points_and_lines.json';
    bufferJs(fixture(fx)
      .pipe(request.post({
        url: url + '/summary',
        headers: {
          'Authorization': 'test-auth',
          'X-App-Token': 'app-token',
          'X-Socrata-Host': 'localhost:6668',
          'Content-Type': 'application/json',
          'Content-Length': sizeOf(fx),
          'X-Blob-Length': sizeOf(fx)
        }
      })), (res, buffered) => {
        expect(res.statusCode).to.equal(200);
        expect(res.headers['content-type']).to.contain('application/json');
        var [l0, l1] = buffered.layers;
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