"use strict";

//TODO: how should this be tested...
// import _ from 'underscore';
// import chai from 'chai';
// import path from 'path';
// import should from 'should';
// import * as es from 'event-stream';
// import {
//   fixture, bufferJs
// }
// from './fixture';
// import request from 'request';
// import CoreMock from './services/mock-core';
// import MockZKClient from './services/mock-zk';
// import {
//   EventEmitter
// }
// from 'events';
// import config from '../lib/config';
// import service from '../lib/service';
// import fs from 'fs';

// var expect = chai.expect;

// describe('unit :: disk allocation/cleanup/logging tests', function() {
//   var app;
//   var mockZk;
//   var mockCore;
//   var port = config().port;
//   var url = `http://localhost:${port}`;

//   beforeEach(function(onDone) {
//     service({
//       zkClient: MockZKClient
//     }, (a, zk) => {
//       mockZk = zk;
//       app = a;
//       mockCore = new CoreMock(mockZk.corePort);
//       onDone();
//     });
//   });

//   afterEach(() => {
//     mockCore.close();
//     app.close();
//   });

/**
 * TODO:
 * This is kind of a stupid test...if anything allocates in /tmp while it is running
 * then it will fail...should probably namespace everything in a /tmp/geo-import dir?
 *
 * TODO: this also breaks ther rest of the test suite, even though it all works??? wtf node
 */
// it('will clean up all allocated files created during a request lifetime', function(onDone) {
//   var files = fs.readdirSync('/tmp');
//   fixture('simple_points.json')
//     .pipe(request.post({
//       url: url + '/spatial',
//       headers: {
//         'Authorization': 'test-auth',
//         'X-App-Token': 'app-token',
//         'X-Socrata-Host': 'localhost:6668',
//         'Content-Type': 'application/json'
//       }
//     }))
//     .on('response', function(response) {
//       setTimeout(() => {
//         //need to wait for the event loop to clear because the removals don't
//         //happen necessarily before the request closes
//         var newFiles = fs.readdirSync('/tmp');
//         var allocations = _.difference(newFiles, files);

//         expect(allocations).to.eql([]);
//         expect(response.statusCode).to.equal(200);
//         onDone();
//       }, 40)
//     });
// });

// it('will clean up all allocated files created during a request, even when the request fails', function(onDone) {
//   var files = fs.readdirSync('/tmp');
//   fixture('simple_points.json')
//     .pipe(request.post({
//       url: url + '/spatial',
//       headers: {
//         'Authorization': 'test-auth',
//         'X-App-Token': 'app-token',
//         'Content-Type': 'application/json'
//       }
//     }))
//     .on('response', function(response) {
//       setTimeout(() => {
//         expect(response.statusCode).to.equal(400);

//         var newFiles = fs.readdirSync('/tmp');
//         var allocations = _.difference(newFiles, files);
//         expect(allocations).to.eql([]);
//         onDone();
//       }, 0)
//     });
// });

// });