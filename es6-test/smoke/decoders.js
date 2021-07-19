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
import config from '../../es6-lib/config';
import service from '../../es6-lib/service';
import Shapefile from '../../es6-lib/decoders/shapefile';
import KMZ from '../../es6-lib/decoders/kmz';
import KML from '../../es6-lib/decoders/kml';
import GeoJSON from '../../es6-lib/decoders/geojson';
import Disk from '../../es6-lib/decoders/disk';
import Merger from '../../es6-lib/decoders/merger';
import {
  ArityChecker,
  NoopLogger
}
from '../util';

var res;
var expect = chai.expect;
var conf = config();

function kmzDecoder() {
  res = new EventEmitter();
  return [new KMZ(new Disk(res, NoopLogger)), res];
}

function shpDecoder() {
  res = new EventEmitter();
  return [new Shapefile(new Disk(res, NoopLogger)), res];
}

function kmlDecoder() {
  res = new EventEmitter();
  return [new KML(new Disk(res, NoopLogger)), res];
}

function geojsonDecoder() {
  res = new EventEmitter();
  return [new GeoJSON(new Disk(res, NoopLogger)), res];
}

function makeMerger(res) {
  res = res || new EventEmitter();
  return [
    new Merger(
      new Disk(res, NoopLogger),
      [],
      false,
      NoopLogger
    ),
    res
  ];
}


describe('decoders', () => {


  afterEach(function() {
    if (res) res.emit('finish');
  });



  it('should handle real multi chunk kmz', function(onDone) {
    this.timeout(150000);
    var [decoder, res] = kmzDecoder();
    var count = 0;
    fixture('smoke/usbr.kmz')
      .pipe(decoder)
      .pipe(new ArityChecker())
      .pipe(es.mapSync((row) => count++))
      .on('end', () => {
        expect(count).to.equal(5);
        res.emit('finish');
        onDone();
      });
  });

  it('should handle real multi chunk shapefile 00', function(onDone) {
    this.timeout(100000);
    var count = 0;
    var [decoder, res] = shpDecoder();
    fixture('smoke/USBR_crs.zip')
      .pipe(decoder)
      .pipe(new ArityChecker())
      .pipe(es.mapSync(function(row) {
        var [theGeom] = row.columns;
        expect(theGeom.isCorrectArity()).to.equal(true);
        count++;
      }))
      .on('end', () => {
        res.emit('finish');
        expect(count).to.equal(5);
        onDone();
      });
  });

  it('should handle real multi chunk shapefile 01', function(onDone) {
    this.timeout(100000);
    var count = 0;
    var [decoder, res] = shpDecoder();
    fixture('smoke/xdpw_supervisorial_districts_2011.zip')
      .pipe(decoder)
      .pipe(new ArityChecker())
      .pipe(es.mapSync((row) => count++))
      .on('end', () => {
        res.emit('finish');
        expect(count).to.equal(5);
        onDone();
      });
  });

  it('should handle real multi chunk shapefile 02', function(onDone) {
    this.timeout(100000);
    var count = 0;
    var [decoder, res] = shpDecoder();
    fixture('smoke/xLibrTaxDist.zip')
      .pipe(decoder)
      .pipe(new ArityChecker())
      .pipe(es.mapSync((row) => count++))
      .on('end', () => {
        res.emit('finish');
        expect(count).to.equal(116);
        onDone();
      });
  });

  it('should handle real multi chunk shapefile 03', function(onDone) {
    this.timeout(100000);
    var count = 0;
    var [decoder, res] = shpDecoder();
    fixture('smoke/xNeighbourhood.zip')
      .pipe(decoder)
      .pipe(new ArityChecker())
      .pipe(es.mapSync((row) => count++))
      .on('end', () => {
        res.emit('finish');
        expect(count).to.equal(236);
        onDone();
      });
  });

  it('should decode municipios correctly', function(onDone) {
    var municipios = [];
    var [decoder, res] = shpDecoder();

    var expectedNames = ['Adjuntas',
      'Aguada',
      'Aguadilla',
      'Aguas Buenas',
      'Aibonito',
      'Arecibo',
      'Arroyo',
      'Añasco',
      'Barceloneta',
      'Barranquitas',
      'Bayamón',
      'Cabo Rojo',
      'Caguas',
      'Camuy',
      'Canóvanas',
      'Carolina',
      'Cataño',
      'Cayey',
      'Ceiba',
      'Ciales',
      'Cidra',
      'Coamo',
      'Comerío',
      'Corozal',
      'Culebra',
      'Dorado',
      'Fajardo',
      'Florida',
      'Guayama',
      'Guayanilla',
      'Guaynabo',
      'Gurabo',
      'Guánica',
      'Hatillo',
      'Hormigueros',
      'Humacao',
      'Isabela',
      'Jayuya',
      'Juana Díaz',
      'Juncos',
      'Lajas',
      'Lares',
      'Las Marías',
      'Las Piedras',
      'Loíza',
      'Luquillo',
      'Manatí',
      'Maricao',
      'Maunabo',
      'Mayagüez',
      'Moca',
      'Morovis',
      'Naguabo',
      'Naranjito',
      'Orocovis',
      'Patillas',
      'Peñuelas',
      'Ponce',
      'Quebradillas',
      'Rincón',
      'Río Grande',
      'Sabana Grande',
      'Salinas',
      'San Germán',
      'San Juan',
      'San Lorenzo',
      'San Sebastián',
      'Santa Isabel',
      'Toa Alta',
      'Toa Baja',
      'Trujillo Alto',
      'Utuado',
      'Vega Alta',
      'Vega Baja',
      'Vieques',
      'Villalba',
      'Yabucoa',
      'Yauco'
    ].sort();

    fixture('smoke/municipios.zip')
      .pipe(decoder)
      .pipe(new ArityChecker())
      .pipe(es.mapSync(row => {
        municipios.push(_.find(row.columns, (col) => col.name === 'municipio').value);
      }))
      .on('end', () => {
        expect(expectedNames).to.eql(municipios.sort());
        onDone();
      });
  });


  it('should handle real multi chunk kml', function(onDone) {
    this.timeout(100000);
    var count = 0;
    var [decoder, res] = kmlDecoder();
    fixture('smoke/usbr.kml')
      .pipe(decoder)
      .pipe(new ArityChecker())
      .pipe(es.mapSync((row) => count++))
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
      .pipe(new ArityChecker())
      .pipe(es.mapSync((row) => count++))
      .on('end', () => {
        res.emit('finish');
        expect(count).to.equal(5);
        onDone();
      });
  });

  it('many many chunks of kml should end up with numbers', function(onDone) {
    this.timeout(100000);
    var count = 0;
    var [decoder, res] = kmlDecoder();
    fixture('smoke/boundaries.kml')
      .pipe(decoder)
      .pipe(es.mapSync((l) => {
        l.columns[0].mapCoordinates(([x, y]) => {
          expect(x).to.not.eql(NaN);
          expect(y).to.not.eql(NaN);

        });
      }))
      .on('end', (layers) => {
        res.emit('finish');
        onDone();
      });
  });

  it('kml nulls', function(onDone) {
    var count = 0;
    var [decoder, res] = kmlDecoder();
    fixture('smoke/noaa.kml')
      .pipe(decoder)
      .pipe(es.mapSync((l) => {
        expect(l.columns.map((c) => c.name).sort()).to.eql([
          "the_geom",
          "name",
          "descriptio"
        ].sort());
      }))
      .on('end', () => {
        res.emit('finish');
        onDone();
      });
  });

  it('KML nested within a KMZ with some links', function(onDone) {
    var [decoder, res] = kmzDecoder();
    var rows = [];
    var expected = ['the_geom',
      'objectid',
      'area',
      'perimeter',
      'patternc',
      'patternc_i',
      'districtc',
      'square_mil',
      'shape_leng',
      'shape_area'
    ].sort();

    fixture('smoke/police_beats_patternc.kmz')
      .pipe(decoder)
      .pipe(new ArityChecker())
      .pipe(es.mapSync((row) => rows.push(row)))
      .on('end', () => {
        rows.map((r) => r.columns.map((c) => c.name)).forEach((colNames) => {
          expect(colNames.sort()).to.eql(expected);
        });
        onDone();
      });
  });

  it('terrassa kml', function(onDone) {
    var [decoder, res] = kmlDecoder();
    var expected = ['the_geom',
      'name',
      'description'
    ].sort();

    fixture('smoke/terrassa.kml')
      .pipe(decoder)
      .pipe(new ArityChecker())
      .pipe(es.mapSync((row) => {
        var colNames = row.columns.map((c) => c.name);
        expect(colNames.sort()).to.eql(expected);
      }))
      .on('end', onDone);
  });

  it('weird line bug where coordinate state was not being reset between elements', function(onDone) {
    var [merger, response] = makeMerger();
    var async = require('async');
    var theRow;

    fixture('line_extra_dimension.kml')
      .pipe(new KML())
      .pipe(es.mapSync((row) => {
        var {
          columns: [{
            value: {
              coordinates: cs,
              type: t
            }
          }, {
            value: name
          }]
        } = row;
        cs.forEach((coord) => {
          if (t !== 'LineString') return;

          chai.assert(coord.length === 2, `${name}::${t} is an invalid linestring ${JSON.stringify(cs, null, 2)}`);
        });
        return row;
      }))
      .pipe(merger)
      .on('end', (layers) => {
        async.map(layers, (layer, cb) => {

          var buf = '[';
          layer
            .pipe(es.mapSync((row) => buf += row.toString()))
            .on('end', () => {
              buf += ']';

              var [js] = JSON.parse(buf);

              js.forEach((row) => {
                var {
                  the_geom: {
                    coordinates: cs,
                    type: t
                  }
                } = row;
                if (t !== 'LineString') return;
                cs.forEach((coord) => {
                  chai.assert(coord.length === 2, `${row.name}::${t} is an invalid linestring ${JSON.stringify(cs, null, 2)}`);
                });
              });

              cb();
            });
        }, onDone);
      });
  });

});