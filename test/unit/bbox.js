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

var _libUtilBbox = require('../../lib/util/bbox');

var _libUtilBbox2 = _interopRequireDefault(_libUtilBbox);

var expect = _chai2['default'].expect;

describe('bounding box', function () {

  it('can expand a bbox', function () {
    var a = new _libUtilBbox2['default']();
    a.expand([3, 4]);
    expect(a._coords).to.eql({
      minx: 3,
      miny: 4,
      maxx: 3,
      maxy: 4
    });
    a.expand([0, 0]);
    expect(a._coords).to.eql({
      minx: 0,
      miny: 0,
      maxx: 3,
      maxy: 4
    });

    //test garbage coords
    a.expand([-1000, 100000]);
    expect(a._coords).to.eql({
      minx: 0,
      miny: 0,
      maxx: 3,
      maxy: 4
    });
  });

  it('can merge bboxes', function () {
    var a = new _libUtilBbox2['default']();
    a.expand([3, 4]);
    expect(a._coords).to.eql({
      minx: 3,
      miny: 4,
      maxx: 3,
      maxy: 4
    });
    a.expand([1, 1]);
    expect(a._coords).to.eql({
      minx: 1,
      miny: 1,
      maxx: 3,
      maxy: 4
    });

    var b = new _libUtilBbox2['default']();
    b.expand([2, 2]);
    expect(b._coords).to.eql({
      minx: 2,
      miny: 2,
      maxx: 2,
      maxy: 2
    });
    b.expand([0, 0]);
    expect(b._coords).to.eql({
      minx: 0,
      miny: 0,
      maxx: 2,
      maxy: 2
    });

    var c = b.merge(a);
    expect(c._coords).to.eql({
      minx: 0,
      miny: 0,
      maxx: 3,
      maxy: 4
    });
  });
});