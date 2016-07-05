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


  it('should be able to handle a mostly null shp', function(onDone) {
    this.timeout(100000);

    const disk = new Disk(res);
    const decoder = new Shapefile(disk);
    const merger = new Merger(disk);

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

});