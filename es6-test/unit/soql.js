import chai from 'chai';
import should from 'should';
import * as es from 'event-stream';
import Layer from '../../lib/decoders/layer';

import SoQLText from '../../lib/soql/text';

var expect = chai.expect;

describe('layer', function() {

  it('will snake case the column names to appease soda-fountain', function() {
    var t = new SoQLText('foo', 'some text')
    expect(t.name).to.equal('foo');

    var t = new SoQLText('fooBar', 'some text')
    expect(t.name).to.equal('foo_bar');

    var t = new SoQLText('foo bar', 'some text')
    expect(t.name).to.equal('foo_bar');

    var t = new SoQLText('FOOBAR', 'some text')
    expect(t.name).to.equal('__foobar');

    var t = new SoQLText('         foobar', 'some text')
    expect(t.name).to.equal('foobar');

    var t = new SoQLText('FooBar', 'some text')
    expect(t.name).to.equal('__foo_bar');

  });

  it('will launder the column names starting with numbers', function() {
    var t = new SoQLText('1_foo', 'some text')
    expect(t.name).to.equal('_1_foo');
  });

});
