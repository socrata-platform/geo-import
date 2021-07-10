import chai from 'chai';
import should from 'should';
import * as es from 'event-stream';
import BBox from '../../es6-lib/util/bbox.js';
var expect = chai.expect;

describe('bounding box', function() {
  it('can expand a bbox', function() {
    var a = new BBox()
    a.expand([3, 4])
    expect(a._coords).to.eql({
      minx: 3,
      miny: 4,
      maxx: 3,
      maxy: 4
    });
    a.expand([0, 0])
    expect(a._coords).to.eql({
      minx: 0,
      miny: 0,
      maxx: 3,
      maxy: 4
    });

    //test garbage coords
    a.expand([-1000, 100000])
    expect(a._coords).to.eql({
      minx: 0,
      miny: 0,
      maxx: 3,
      maxy: 4
    });
  });


  it('can merge bboxes', function() {
    var a = new BBox()
    a.expand([3, 4])
    expect(a._coords).to.eql({
      minx: 3,
      miny: 4,
      maxx: 3,
      maxy: 4
    });
    a.expand([1, 1])
    expect(a._coords).to.eql({
      minx: 1,
      miny: 1,
      maxx: 3,
      maxy: 4
    });

    var b = new BBox()
    b.expand([2, 2])
    expect(b._coords).to.eql({
      minx: 2,
      miny: 2,
      maxx: 2,
      maxy: 2
    });
    b.expand([0, 0])
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
    })
  });
});
