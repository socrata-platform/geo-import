import chai from 'chai';
import should from 'should';
import es from 'event-stream';
import { fixture } from '../fixture.js';
import Parser from '../../es6-lib/util/parser.js';
var expect = chai.expect;

describe('streaming js parser', function() {

  it('can select an object', function(onDone) {
    var count = 0;
    fixture('parser/objects.json')
      .pipe(new Parser('features'))
      .pipe(es.mapSync(function(thing) {
        expect(thing).to.eql({
          "foo": 1,
          "bar": "bar value",
          "baz": true
        });
        count++;
      })).on('end', () => {
        expect(count).to.equal(1);
        onDone();
      });
  });

  it('can select an array', function(onDone) {
    var count = 0;
    fixture('parser/array.json')
      .pipe(new Parser('features'))
      .pipe(es.mapSync(function(thing) {
        expect(thing).to.eql([1, 2, 3, 4]);
        count++;
      })).on('end', () => {
        expect(count).to.equal(1);
        onDone();
      });
  });

  it('can select a nested array', function(onDone) {
    var count = 0;
    fixture('parser/nested-array.json')
      .pipe(new Parser('features'))
      .pipe(es.mapSync(function(thing) {
        expect(thing).to.eql([1, 2, 3, [4, 5, 6],
          [7, 8, 9, [10, 11, 12]]
        ]);
        count++;
      })).on('end', () => {
        expect(count).to.equal(1);
        onDone();
      });
  });

  it('can select within a nested array', function(onDone) {
    var count = 0;
    var expected = [4, 5, 6, 7, 8, 9, [10, 11, 12]];
    fixture('parser/nested-array.json')
      .pipe(new Parser('features.*.*'))
      .pipe(es.mapSync(function(thing) {
        expect(thing).to.eql(expected[count]);
        count++;
      })).on('end', () => {
        expect(count).to.equal(7);
        onDone();
      });
  });

  it('can select a nested object', function(onDone) {
    var count = 0;
    fixture('parser/objects-nested.json')
      .pipe(new Parser('features'))
      .pipe(es.mapSync(function(thing) {
        expect(thing).to.eql({
          "foo": 1,
          "bar": {
            "nested": "bar value"
          },
          "baz": true
        });
        count++;
      })).on('end', () => {
        expect(count).to.equal(1);
        onDone();
      });
  });

  it('can select object in a nested path', function(onDone) {
    var count = 0;
    fixture('parser/objects-nested.json')
      .pipe(new Parser('features.bar'))
      .pipe(es.mapSync(function(thing) {
        expect(thing).to.eql({
          "nested": "bar value"
        });
        count++;
      })).on('end', () => {
        expect(count).to.equal(1);
        onDone();
      });
  });

  it('can select a nested value in an object path', function(onDone) {
    var count = 0;
    fixture('parser/objects-nested.json')
      .pipe(new Parser('features.bar.nested'))
      .pipe(es.mapSync(function(thing) {
        expect(thing).to.eql("bar value");
        count++;
      })).on('end', () => {
        expect(count).to.equal(1);
        onDone();
      });
  });

  it('can select object in an array', function(onDone) {
    var expected = [{
      "foo": 1,
      "bar": "bar 1 value",
      "baz": true
    }, {
      "foo": 2,
      "bar": "bar 2 value",
      "baz": null
    }, {
      "foo": 3,
      "bar": "bar 3 value",
      "baz": false
    }];
    var count = 0;

    fixture('parser/obj-array.json')
      .pipe(new Parser('features.*'))
      .pipe(es.mapSync(function(thing) {
        expect(thing).to.eql(expected[count]);
        count++;
      })).on('end', () => {
        expect(count).to.equal(3);
        onDone();
      });
  });


  it('can emit objects in a nested array path', function(onDone) {
    var expected = [1, 2, 3];
    var count = 0;

    fixture('parser/obj-array.json')
      .pipe(new Parser('features.*.foo'))
      .pipe(es.mapSync(function(thing) {
        expect(thing).to.eql(expected[count]);
        count++;
      })).on('end', () => {
        expect(count).to.equal(3);
        onDone();
      });
  });


  it('can emit objects in arrays', function(onDone) {
    var expected = [{
      "foo": {
        "foo_nested": "something",
        "foo_nested_1": 1
      },
      "bar": "bar 1 value",
      "baz": true
    }, {
      "foo": {
        "foo_nested": "something",
        "foo_nested_1": 2
      },
      "bar": "bar 2 value",
      "baz": null
    }, {
      "foo": {
        "foo_nested": "something",
        "foo_nested_1": 3
      },
      "bar": "bar 3 value",
      "baz": false
    }];

    var count = 0;

    fixture('parser/nested-obj-array.json')
      .pipe(new Parser('features.*'))
      .pipe(es.mapSync(function(thing) {
        expect(thing).to.eql(expected[count]);
        count++;
      })).on('end', () => {
        expect(count).to.equal(3);
        onDone();
      });
  });


  it('can emit arrays in nested object array path', function(onDone) {
    var expected = [
      [
        102.0,
        0.5
      ],
      [
        103.0,
        1.5
      ]
    ];
    var count = 0;

    fixture('simple_points.json')
      .pipe(new Parser('features.*.geometry.coordinates'))
      .pipe(es.mapSync(function(thing) {
        expect(thing).to.eql(expected[count]);
        count++;
      })).on('end', () => {
        expect(count).to.equal(2);
        onDone();
      });
  });

  it('matching current state works', function() {
    var p = new Parser('a.b.c');

    p._stack = ['a', 'b'];
    expect(p.matching()).to.equal(false);

    p._stack = ['a', 'b', 'c'];
    expect(p.matching()).to.equal(true);

    p._stack = ['a', 'b', 'c', 'd'];
    expect(p.matching()).to.equal(true);

  });


  it('empty objs', function(onDone) {
    var actual;
    fixture('empty_attrs.json')
      .pipe(new Parser('features'))
      .pipe(es.mapSync(function(thing) {
        actual = thing;
      })).on('end', () => {
        expect(actual).to.eql({ foo: {}, bar: 'baz' });
        onDone();
      });

  });


});