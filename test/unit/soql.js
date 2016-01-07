'use strict';

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _chai = require('chai');

var _chai2 = _interopRequireDefault(_chai);

var _should = require('should');

var _should2 = _interopRequireDefault(_should);

var _eventStream = require('event-stream');

var es = _interopRequireWildcard(_eventStream);

var _libDecodersLayer = require('../../lib/decoders/layer');

var _libDecodersLayer2 = _interopRequireDefault(_libDecodersLayer);

var _libSoqlText = require('../../lib/soql/text');

var _libSoqlText2 = _interopRequireDefault(_libSoqlText);

var expect = _chai2['default'].expect;

describe('layer', function () {

  it('will snake case the column names to appease soda-fountain', function () {
    var t = new _libSoqlText2['default']('foo', 'some text');
    expect(t.name).to.equal('foo');

    var t = new _libSoqlText2['default']('fooBar', 'some text');
    expect(t.name).to.equal('foo_bar');

    var t = new _libSoqlText2['default']('foo bar', 'some text');
    expect(t.name).to.equal('foo_bar');

    var t = new _libSoqlText2['default']('FOOBAR', 'some text');
    expect(t.name).to.equal('foobar');

    var t = new _libSoqlText2['default']('         foobar', 'some text');
    expect(t.name).to.equal('foobar');

    var t = new _libSoqlText2['default']('FooBar', 'some text');
    expect(t.name).to.equal('foo_bar');
  });

  it('will launder the column names starting with numbers', function () {
    var t = new _libSoqlText2['default']('1_foo', 'some text');
    expect(t.name).to.equal('_1_foo');
  });
});