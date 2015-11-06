// import chai from 'chai';
// import should from 'should';
// import * as es from 'event-stream';
// import {
//   fixture
// }
// from './fixture';
// import KMZ from '../lib/decoders/kmz';
// var expect = chai.expect;


// describe('unit :: kmz decoder turns things into SoQLTypes', function() {
//   it('can turn simple points to SoQLPoint', function(onDone) {
//     var kmz = new KMZ();
//     var count = 0;

//     var expectedValues = [
//       [{
//           "type": "Point",
//           "coordinates": [
//             102.0,
//             0.5
//           ]
//         },
//         "first value",
//         2,
//         2.2,
//         false
//       ],
//       [{
//           "type": "Point",
//           "coordinates": [
//             103.0,
//             1.5
//           ]
//         },

//         "second value",
//         2,
//         2.2,
//         true
//       ]
//     ];



//     kmz.toFeatures(fixture('simple_points.kmz'))
//       .pipe(es.mapSync(function(thing) {
//         let columns = thing.columns;

//         expect(columns.map((c) => c.constructor.name)).to.eql([
//           'SoQLPoint',
//           'SoQLText',
//           'SoQLNumber',
//           'SoQLNumber',
//           'SoQLBoolean'
//         ]);

//         expect(columns.map((c) => c.value)).to.eql(expectedValues[count]);
//         count++;
//       })).on('end', () => {
//         expect(count).to.equal(2);
//         onDone();
//       });
//   });
// });