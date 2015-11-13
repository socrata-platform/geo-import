import _ from 'underscore';
import chai from 'chai';
import should from 'should';
import * as es from 'event-stream';
import {
  fixture, bufferJs
}
from './fixture';
import request from 'request';
import CoreMock from './services/mock-core';
import MockZKClient from './services/mock-zk';
import {
  EventEmitter
}
from 'events';
import config from '../lib/config';
import service from '../lib/service';

var app;


beforeEach((onDone) => {
  // var min = 1100;
  // var max = 1200;
  // var port = Math.floor(Math.random() * (max - min + 1)) + min;
  // console.log("Before!");
  var port = config().port;
  global.url = `http://localhost:${port}`;

  service({
    zkClient: MockZKClient
  }, (a, zk) => {
    global.mockZk = zk;
    app = a;
    global.mockCore = new CoreMock(mockZk.corePort);
    console.log(`Starting core on ${mockZk.corePort}`);
    setTimeout(() => {
      onDone(false, "okok");
    }, 200)
  });
});

afterEach((onClosed) => {
  console.log("After!")

    var onDone = _.after(2, onClosed);
    mockCore.close = onDone
    app.close = onDone

    console.log("CLOSING", app.address());
    console.log("CLOSING CORE", mockCore);
    mockCore.close();
    app.close();

});