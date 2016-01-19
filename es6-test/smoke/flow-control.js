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
import Merger from '../../lib/decoders/merger';
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

  it('will not overwhelm kmz stream consumer', function(onDone) {
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

  it('will not stop reading when kmz stream consumer is unpiped', function(onDone) {
    //for jankins
    this.timeout(10000);

    var count = 0;
    var [decoder, res] = kmzDecoder();
    var slowConsumer = new SlowConsumer();

    decoder.on('end', () => {
      expect(decoder._readableState.endEmitted).to.equal(true);
      onDone();
    });

    fixture('smoke/wards.kmz')
      .pipe(decoder)
      .pipe(slowConsumer)
      .pipe(es.mapSync((t) => {
        count++;
        //simulate the consumer going away mid stream
        if (count > 8) {
          decoder.unpipe(slowConsumer);
        }
        return t;
      }));
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

  it('will stop flowing when shapefile reader is unpiped', function(onDone) {
    //for jankins
    this.timeout(10000);

    var count = 0;
    var [decoder, res] = shpDecoder();
    var slowConsumer = new SlowConsumer();

    decoder.on('end', () => {
      expect(decoder._readableState.endEmitted).to.equal(true);
      onDone();
    });

    fixture('smoke/wards.zip')
      .pipe(decoder)
      .pipe(slowConsumer)
      .pipe(es.mapSync((t) => {
        count++;
        //simulate the consumer going away mid stream
        if (count > 8) {
          decoder.unpipe(slowConsumer);
        }
        return t;
      }));
  });

  it('will not overwhelm merger stream consumer', function(onDone) {
    this.timeout(10000);
    var count = 0;

    var res = new EventEmitter();
    var disk = new Disk(res);

    var decoder = new Shapefile(disk);
    var merger = new Merger(disk, []);

    fixture('smoke/wards.zip')
      .pipe(decoder)
      .pipe(merger)
      .on('end', (layers) => {
        layers.map((layer) => {
          layer
            .pipe(new SlowConsumer())
            .pipe(es.mapSync((thing) => {
              expect(layer._readableState.length).to.be.at.most(64000);
              return thing;
            }))
            .on('end', () => {
              res.emit('finish');
              onDone();
            });
        });
      });
  });


  it('will stop flowing when a layer consumer is unpiped', function(onDone) {
    //for jankins
    this.timeout(10000);

    var res = new EventEmitter();
    var disk = new Disk(res);
    var decoder = new Shapefile(disk);
    var merger = new Merger(disk, []);
    var slowConsumer = new SlowConsumer();

    fixture('smoke/wards.zip')
      .pipe(decoder)
      .pipe(merger)
      .on('end', (layers) => {
        layers.map((layer) => {
          var layerCount = 0;
          layer
            .pipe(slowConsumer)
            .pipe(es.mapSync(() => {
              if (layerCount++ > 8) {
                layer.unpipe(slowConsumer);
              }
            }));

          layer.on('end', () => {
            expect(layer._readableState.endEmitted).to.equal(true);

            res.emit('finish');
            onDone();
          });

        });
      });
  });

});