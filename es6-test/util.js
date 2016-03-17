import chai from 'chai';
import {
  Transform
}
from 'stream';
var res;
var expect = chai.expect;

class ArityChecker extends Transform {
  constructor() {
    super({
      objectMode: true
    })
  }

  _transform(row, _encoding, done) {
    var [theGeom] = row.columns;
    expect(theGeom.isCorrectArity()).to.equal(true);
    done(false, row);
  }
}

export {
  ArityChecker
}