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

var res;
var expect = chai.expect;

function kmzDecoder() {
  res = new EventEmitter();
  return new KMZ(new Disk(res));
}
function shpDecoder() {
  res = new EventEmitter();
  return [new Shapefile(new Disk(res)), res];
}
function kmlDecoder() {
  res = new EventEmitter();
  return [new KML(new Disk(res)), res];
}
function geojsonDecoder() {
  res = new EventEmitter();
  return [new GeoJSON(new Disk(res)), res];
}




describe('decoders', () => {


  afterEach(function() {
    if(res) res.emit('finish');
  });



  it('should handle real multi chunk kmz', function(onDone) {
    this.timeout(150000);
    var count = 0;
    fixture('smoke/usbr.kmz')
      .pipe(kmzDecoder())
      .pipe(es.mapSync(function(thing) {
        count++;
      }))
      .on('end', () => {
        expect(count).to.equal(5);
        onDone();
      });
  });


  it('should handle real multi chunk shapefile', function(onDone) {
    this.timeout(100000);
    var count = 0;
    var [decoder, res] = shpDecoder();
    fixture('smoke/USBR_crs.zip')
      .pipe(decoder)
      .pipe(es.mapSync(function(thing) {
        count++;
      }))
      .on('end', () => {
        res.emit('finish');
        expect(count).to.equal(5);
        onDone();
      });
  });

  it('should handle real multi chunk kml', function(onDone) {
    this.timeout(100000);
    var count = 0;
    var [decoder, res] = kmlDecoder();
    fixture('smoke/usbr.kml')
      .pipe(decoder)
      .pipe(es.mapSync(function(thing) {
        count++;
      }))
      .on('end', () => {
        res.emit('finish');
        expect(count).to.equal(5);
        onDone();
      });
  });

  it('should handle real multi chunk geojson', function(onDone) {
    this.timeout(250000);
    var count = 0;
    var [decoder, res] = geojsonDecoder();
    fixture('smoke/usbr.geojson')
      .pipe(decoder)
      .pipe(es.mapSync(function(thing) {
        count++;
      }))
      .on('end', () => {
        res.emit('finish');
        expect(count).to.equal(5);
        onDone();
      });
  });
});