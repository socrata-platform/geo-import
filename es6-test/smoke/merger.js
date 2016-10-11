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
import Shapefile from '../../lib/decoders/shapefile';
import KMZ from '../../lib/decoders/kmz';
import KML from '../../lib/decoders/kml';
import GeoJSON from '../../lib/decoders/geojson';
import Disk from '../../lib/decoders/disk';
import Merger from '../../lib/decoders/merger';
import {
  NoopLogger,
  ArityChecker
}
from '../util';
import DevNull from '../../lib/util/devnull';


var res;
var expect = chai.expect;
var conf = config();


describe('merger', () => {
  beforeEach(function() {
    res = new EventEmitter();
  });

  afterEach(function() {
    if (res) res.emit('finish');
  });


  it('broken geojson', function(onDone) {

    const disk = new Disk(res, NoopLogger);
    const decoder = new GeoJSON(disk);
    const merger = new Merger(disk, [], false, NoopLogger);
    var rows = [];
    fixture('smoke/private_public.geojson')
      .pipe(decoder)
      .pipe(merger)
      .on('end', (layers) => {
        const [layer] = layers;

        layer
          .on('error', (e) => {
            expect(e.toJSON()).to.eql({
              eventType: 'invalid-arity-error',
              info: {
                english: 'One of the points in the following row did not have 2 coordinates [{"type":"Point","coordinates":{}},"City Feature","Common Name","Address","Latitude","Location","Icon","Website","Benefit"]',
                row: '[{"type":"Point","coordinates":{}},"City Feature","Common Name","Address","Latitude","Location","Icon","Website","Benefit"]'
              }
            });
            onDone();
          })
          .pipe(new DevNull());
      });
  });


  it('should be able to handle a mostly null shp', function(onDone) {
    this.timeout(100000);

    const disk = new Disk(res, NoopLogger);
    const decoder = new Shapefile(disk);
    const merger = new Merger(disk, [], false, NoopLogger);

    fixture('smoke/CATCH_BASIN_LEAD_POLY.zip')
      .pipe(decoder)
      .pipe(merger)
      .on('end', (layers) => {
        const [layer] = layers;

        layer.pipe(new DevNull()).on('finish', () => {



          layer.bbox.minx.should.be.approximately(-113.71250, 0.0001);
          layer.bbox.miny.should.be.approximately(53.39732, 0.0001);
          layer.bbox.maxx.should.be.approximately(-113.29525, 0.0001);
          layer.bbox.maxy.should.be.approximately(53.65448, 0.0001);

          expect(layer.columns.map(c => c.toJSON())).to.eql([{
            fieldName: 'the_geom',
            name: 'the_geom',
            dataTypeName: 'line'
          }, {
            fieldName: 'facility',
            name: 'FACILITY',
            dataTypeName: 'text'
          }, {
            fieldName: 'type',
            name: 'TYPE',
            dataTypeName: 'text'
          }, {
            fieldName: 'year_const',
            name: 'YEAR_CONST',
            dataTypeName: 'number'
          }, {
            fieldName: 'nghbrhd',
            name: 'NGHBRHD',
            dataTypeName: 'text'
          }, {
            fieldName: 'nghbrhd_id',
            name: 'NGHBRHD_ID',
            dataTypeName: 'text'
          }, {
            fieldName: 'ward',
            name: 'WARD',
            dataTypeName: 'text'
          }, {
            fieldName: 'str_ave',
            name: 'STR_AVE',
            dataTypeName: 'text'
          }]);
          res.emit('finish');
          onDone();
        });
      });
  });



  it('co parcels', function(onDone) {
    this.timeout(100000);

    const disk = new Disk(res, NoopLogger);
    const decoder = new Shapefile(disk);
    const merger = new Merger(disk, [], false, NoopLogger);

    fixture('smoke/co-parcels.zip')
      .pipe(decoder)
      .pipe(merger)
      .on('end', (layers) => {
        const [layer] = layers;

        layer.pipe(new DevNull()).on('finish', () => {
          const cols = layer.columns.map(c => c.toJSON());

          const dbf = _.find(cols, c => c.name === 'invalid_the_geom');
          const shp = _.find(cols, c => c.name === 'the_geom');

          expect(dbf).to.be.defined;
          expect(shp).to.be.defined;
          expect(shp.dataTypeName).to.eql('multipolygon');
          expect(dbf.dataTypeName).to.eql('text');

          onDone();
        });
      });
  });


});