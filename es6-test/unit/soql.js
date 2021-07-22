import chai from 'chai';
import should from 'should';
import Layer from '../../es6-lib/decoders/layer.js';
import SoQLText from '../../es6-lib/soql/text.js';

var expect = chai.expect;

describe('layer', function() {

  it('will snake case the column names to appease soda-fountain', function() {
    var t = new SoQLText('foo', 'some text');
    expect(t.name).to.equal('foo');

    t = new SoQLText('fooBar', 'some text');
    expect(t.name).to.equal('foo_bar');

    t = new SoQLText('foo bar', 'some text');
    expect(t.name).to.equal('foo_bar');

    t = new SoQLText('FOOBAR', 'some text');
    expect(t.name).to.equal('foobar');

    t = new SoQLText('         foobar', 'some text');
    expect(t.name).to.equal('foobar');

    t = new SoQLText('FooBar', 'some text');
    expect(t.name).to.equal('foo_bar');
  });

  it('will launder the column names starting with numbers', function() {
    var t = new SoQLText('1_foo', 'some text');
    expect(t.name).to.equal('_1_foo');
  });

  it('can launder multiple times', function() {
    var t = new SoQLText('_1_foo', 'some text');
    expect(t.name).to.equal('_1_foo');
  });
});
