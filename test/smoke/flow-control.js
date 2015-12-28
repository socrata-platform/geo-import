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
import {
  Transform
}
from 'stream';

var res;
var expect = chai.expect;

function kmzDecoder() {
  res = new EventEmitter();
  return [new KMZ(new Disk(res)), res];
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

class SlowConsumer extends Transform {
  constructor() {
    super({
      objectMode: true
    });
  }

  _transform(chunk, encoding, done) {
    setTimeout(() => {
      done(false, chunk);
    }, 50);
  }
}



describe('flow control', () => {
  afterEach(function() {
    if (res) res.emit('finish');
  });

  it('will not overwhelm geojson stream consumer', function(onDone) {
    this.timeout(25000);
    var count = 0;
    var [decoder, res] = geojsonDecoder();
    fixture('smoke/wards.geojson')
      .pipe(decoder)
      .pipe(new SlowConsumer())
      .pipe(es.mapSync(() => {
        //length of things that are being buffered in the decoder
        expect(decoder._readableState.length).to.be.at.most(20);
        count++;
      }))
      .on('end', () => {
        res.emit('finish');
        expect(count).to.equal(53);
        onDone();
      });
  });

  it('will not overwhelm kml stream consumer', function(onDone) {
    this.timeout(10000);
    var count = 0;
    var [decoder, res] = kmlDecoder();
    fixture('smoke/wards.kml')
      .pipe(decoder)
      .pipe(new SlowConsumer())
      .pipe(es.mapSync(() => {
        expect(decoder._readableState.length).to.be.at.most(20);
        count++;
      }))
      .on('end', () => {
        res.emit('finish');
        expect(count).to.equal(53);
        onDone();
      });
  });

  it('will not overwhelm kml stream consumer', function(onDone) {
    this.timeout(10000);
    var count = 0;
    var [decoder, res] = kmzDecoder();
    fixture('smoke/wards.kmz')
      .pipe(decoder)
      .pipe(new SlowConsumer())
      .pipe(es.mapSync(() => {
        expect(decoder._readableState.length).to.be.at.most(20);
        count++;
      }))
      .on('end', () => {
        res.emit('finish');
        expect(count).to.equal(53);
        onDone();
      });
  });

  it('will not overwhelm shapefile stream consumer', function(onDone) {
    this.timeout(10000);
    var count = 0;
    var [decoder, res] = shpDecoder();
    fixture('smoke/wards.zip')
      .pipe(decoder)
      .pipe(new SlowConsumer())
      .pipe(es.mapSync(() => {
        expect(decoder._readableState.length).to.be.at.most(20);
        count++;
      }))
      .on('end', () => {
        res.emit('finish');
        expect(count).to.equal(53);
        onDone();
      });
  });

});