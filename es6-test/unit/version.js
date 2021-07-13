import _ from 'underscore';
import chai from 'chai';
import should from 'should';
import request from 'request';
import MockZKClient from '../services/mock-zk.js';
import config from '../../es6-lib/config/index.js';
import service from '../../es6-lib/service.js';
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pack = require("../../package.json")

var expect = chai.expect;

describe('version service', function() {
  var app;
  var port = config().port;
  var url = `http://localhost:${port}`;
  var corePort = 7000;

  beforeEach((onDone) => {
    var zk = new MockZKClient(corePort);
    service(zk, {}, (a, zk) => {
      app = a;
      onDone();
    });
  });

  afterEach(() => app.close());

  it('can get the version of the service', function(onDone) {
    request
      .get(`${url}/version`, function(err, res) {
        expect(JSON.parse(res.body)).to.eql({
          version: pack.version,
          name: pack.name
        });
        expect(res.statusCode).to.equal(200);
        expect(res.headers['content-type']).to.contain('application/json');
        onDone();
      });
  });


});