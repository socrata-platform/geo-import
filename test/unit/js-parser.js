'use strict';

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _chai = require('chai');

var _chai2 = _interopRequireDefault(_chai);

var _should = require('should');

var _should2 = _interopRequireDefault(_should);

var _eventStream = require('event-stream');

var es = _interopRequireWildcard(_eventStream);

var _fixture = require('../fixture');

var _libUtilParser = require('../../lib/util/parser');

var _libUtilParser2 = _interopRequireDefault(_libUtilParser);

var expect = _chai2['default'].expect;

describe('streaming js parser', function () {

  it('can select an object', function (onDone) {
    var count = 0;
    (0, _fixture.fixture)('parser/objects.json').pipe(new _libUtilParser2['default']('features')).pipe(es.mapSync(function (thing) {
      expect(thing).to.eql({
        "foo": 1,
        "bar": "bar value",
        "baz": true
      });
      count++;
    })).on('end', function () {
      expect(count).to.equal(1);
      onDone();
    });
  });

  it('can select an array', function (onDone) {
    var count = 0;
    (0, _fixture.fixture)('parser/array.json').pipe(new _libUtilParser2['default']('features')).pipe(es.mapSync(function (thing) {
      expect(thing).to.eql([1, 2, 3, 4]);
      count++;
    })).on('end', function () {
      expect(count).to.equal(1);
      onDone();
    });
  });

  it('can select a nested array', function (onDone) {
    var count = 0;
    (0, _fixture.fixture)('parser/nested-array.json').pipe(new _libUtilParser2['default']('features')).pipe(es.mapSync(function (thing) {
      expect(thing).to.eql([1, 2, 3, [4, 5, 6], [7, 8, 9, [10, 11, 12]]]);
      count++;
    })).on('end', function () {
      expect(count).to.equal(1);
      onDone();
    });
  });

  it('can select within a nested array', function (onDone) {
    var count = 0;
    var expected = [4, 5, 6, 7, 8, 9, [10, 11, 12]];
    (0, _fixture.fixture)('parser/nested-array.json').pipe(new _libUtilParser2['default']('features.*.*')).pipe(es.mapSync(function (thing) {
      expect(thing).to.eql(expected[count]);
      count++;
    })).on('end', function () {
      expect(count).to.equal(7);
      onDone();
    });
  });

  it('can select a nested object', function (onDone) {
    var count = 0;
    (0, _fixture.fixture)('parser/objects-nested.json').pipe(new _libUtilParser2['default']('features')).pipe(es.mapSync(function (thing) {
      expect(thing).to.eql({
        "foo": 1,
        "bar": {
          "nested": "bar value"
        },
        "baz": true
      });
      count++;
    })).on('end', function () {
      expect(count).to.equal(1);
      onDone();
    });
  });

  it('can select object in a nested path', function (onDone) {
    var count = 0;
    (0, _fixture.fixture)('parser/objects-nested.json').pipe(new _libUtilParser2['default']('features.bar')).pipe(es.mapSync(function (thing) {
      expect(thing).to.eql({
        "nested": "bar value"
      });
      count++;
    })).on('end', function () {
      expect(count).to.equal(1);
      onDone();
    });
  });

  it('can select a nested value in an object path', function (onDone) {
    var count = 0;
    (0, _fixture.fixture)('parser/objects-nested.json').pipe(new _libUtilParser2['default']('features.bar.nested')).pipe(es.mapSync(function (thing) {
      expect(thing).to.eql("bar value");
      count++;
    })).on('end', function () {
      expect(count).to.equal(1);
      onDone();
    });
  });

  it('can select object in an array', function (onDone) {
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

    (0, _fixture.fixture)('parser/obj-array.json').pipe(new _libUtilParser2['default']('features.*')).pipe(es.mapSync(function (thing) {
      expect(thing).to.eql(expected[count]);
      count++;
    })).on('end', function () {
      expect(count).to.equal(3);
      onDone();
    });
  });

  it('can emit objects in a nested array path', function (onDone) {
    var expected = [1, 2, 3];
    var count = 0;

    (0, _fixture.fixture)('parser/obj-array.json').pipe(new _libUtilParser2['default']('features.*.foo')).pipe(es.mapSync(function (thing) {
      expect(thing).to.eql(expected[count]);
      count++;
    })).on('end', function () {
      expect(count).to.equal(3);
      onDone();
    });
  });

  it('can emit objects in arrays', function (onDone) {
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

    (0, _fixture.fixture)('parser/nested-obj-array.json').pipe(new _libUtilParser2['default']('features.*')).pipe(es.mapSync(function (thing) {
      expect(thing).to.eql(expected[count]);
      count++;
    })).on('end', function () {
      expect(count).to.equal(3);
      onDone();
    });
  });

  it('can emit arrays in nested object array path', function (onDone) {
    var expected = [[102.0, 0.5], [103.0, 1.5]];
    var count = 0;

    (0, _fixture.fixture)('simple_points.json').pipe(new _libUtilParser2['default']('features.*.geometry.coordinates')).pipe(es.mapSync(function (thing) {
      expect(thing).to.eql(expected[count]);
      count++;
    })).on('end', function () {
      expect(count).to.equal(2);
      onDone();
    });
  });

  it('matching current state works', function () {
    var p = new _libUtilParser2['default']('a.b.c');

    p._stack = ['a', 'b'];
    expect(p.matching()).to.equal(false);

    p._stack = ['a', 'b', 'c'];
    expect(p.matching()).to.equal(true);

    p._stack = ['a', 'b', 'c', 'd'];
    expect(p.matching()).to.equal(true);
  });
});