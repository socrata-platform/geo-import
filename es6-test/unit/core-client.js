import { expect } from 'chai';
import should from 'should';
import CoreService from '../services/mock-core.js';
import MockZKClient from '../services/mock-zk.js';
import AmqMock from '../services/mock-amq.js';
import Core from '../../es6-lib/upstream/core.js';
import Auth from '../../es6-lib/upstream/auth.js';
import { bufferJs } from '../fixture.js';
import { NoopLogger } from '../util.js';
import { parseAMQMessage } from '../../es6-lib/util/hacks.js';

describe('core client', function() {
  var mockCore;
  var mockZk;
  var mockAmq;
  var port = 6668;
  var url = `http://localhost:${port}`;

  beforeEach(function(onDone) {
    mockZk = new MockZKClient(port);
    mockZk.on('connected', function() {
      mockCore = new CoreService(port);
      mockAmq = new AmqMock();

      onDone();
    });
    mockZk.connect();
  });

  afterEach(function() {
    mockCore.close();
  });

  it('can get cloudy file data from core', function(onDone) {
    var request = {
      headers: {
        'x-app-token': 'test-token',
        'x-socrata-host': 'test-host',
      },
      log: {
        info: () => {}
      }
    };

    const message = mockAmq.messageFor(
      'four-four',
      'simple_points.json', ['foo'],
      'test-host',
      'test-token',
      'test-cookie',
      'test-reqid'
    )
    const auth = new Auth(parseAMQMessage(message), mockZk, NoopLogger);
    const core = new Core(auth, mockZk, NoopLogger);

    core.getBlob('simple_points.json', (err, res) => {
      bufferJs(res, (err, result) => {
        expect(result).to.eql({
          "type": "FeatureCollection",
          "features": [{
            "type": "Feature",
            "geometry": {
              "type": "Point",
              "coordinates": [
                102,
                0.5
              ]
            },
            "properties": {
              "a_string": "first value",
              "a_num": 2,
              "a_float": 2.2,
              "a_bool": false
            }
          }, {
            "type": "Feature",
            "geometry": {
              "type": "Point",
              "coordinates": [
                103,
                1.5
              ]
            },
            "properties": {
              "a_string": "second value",
              "a_num": 2,
              "a_float": 2.2,
              "a_bool": true
            }
          }]
        })
        onDone();
      })
    });
  });

  it('passes headers through to core', function(onDone) {
    const message = mockAmq.messageFor(
      'replace',
      'four-four',
      'simple_points.json',
      ['foo'],
      'test-host',
      null,
      null,
      null
    )

    const auth = new Auth(parseAMQMessage(message), mockZk, NoopLogger);
    var core = new Core(auth, mockZk, NoopLogger);

    core.create('ffff-ffff', 'my_layer', (err, res) => {
      expect(err.status()).to.equal(502);
      onDone();
    });
  });


  it("can make a create request to core", function(onDone) {
    const message = mockAmq.messageFor(
      'create',
      'four-four',
      'simple_points.json', ['foo'],
      'test-host',
      'test-token',
      'test-cookie',
      'test-reqid'
    )
    const auth = new Auth(parseAMQMessage(message), mockZk, NoopLogger);
    var core = new Core(auth, mockZk, NoopLogger);

    core.create('pare-ntid', 'my_layer', (err, res) => {
      expect(res.id).to.equal('qs32-qpt7');
      onDone();
    });
  });

  it("can make a replace request to core", function(onDone) {
    const message = mockAmq.messageFor(
      'replace',
      'four-four',
      'simple_points.json', ['foo'],
      'test-host',
      'test-token',
      'test-cookie',
      'test-reqid'
    )
    const auth = new Auth(parseAMQMessage(message), mockZk, NoopLogger);
    var core = new Core(auth, mockZk, NoopLogger);

    core.replace('my_layer', (err, res) => {
      expect(res.id).to.equal('qs32-qpt8');
      onDone();
    });
  });


  it("can make an updateMetadata request to core", function(onDone) {
    const message = mockAmq.messageFor(
      'four-four',
      'simple_points.json', ['foo'],
      'test-host',
      'test-token',
      'test-cookie',
      'test-reqid'
    )
    const auth = new Auth(parseAMQMessage(message), mockZk, NoopLogger);
    var core = new Core(auth, mockZk, NoopLogger);

    const metadata = {
      foo: 1,
      bar: 'baz'
    }
    const privateMetadata = {
      secret: 'metadata'
    }


    core.updateMetadata('four-four', metadata, privateMetadata, (err, res) => {
      expect(res).to.deep.eql({
        displayType: 'map',
        metadata: {
          foo: 1,
          bar: 'baz'
        },
        privateMetadata: {
          secret: 'metadata'
        }
      })
      onDone();
    });
  });

});
