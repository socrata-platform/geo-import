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

var res;
var expect = chai.expect;


function kmlDecoder() {
  res = new EventEmitter();
  var d = new Disk(res);
  return [new KML(d), new Merger(d, []), res];
}





describe('layers', () => {


  afterEach(function() {
    if(res) res.emit('finish');
  });


  it('should write multi chunk kml to disk', function(onDone) {
    this.timeout(100000);
    var count = 0;
    var [decoder, merger, res] = kmlDecoder();
    fixture('smoke/usbr.kml')
      .pipe(decoder)
      .pipe(merger)
      .on('end', (layers) => {
        res.emit('finish');

        onDone();
      });
  });

});