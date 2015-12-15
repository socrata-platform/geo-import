import clarinet from 'clarinet';
import {
  Transform
}
from 'stream';
import _ from 'underscore';

class Parser extends Transform {
  constructor(path) {
    super({
      objectMode: true
    });
    this._desiredPath = path.split('.');

    this._stack = [];
    this._state = [];

    this._underlying = clarinet.parser();
    this._underlying.onerror = this._onerror.bind(this);
    this._underlying.onvalue = this._onvalue.bind(this);
    this._underlying.onopenobject = this._onopenobject.bind(this);
    this._underlying.onkey = this._onkey.bind(this);
    this._underlying.oncloseobject = this._oncloseobject.bind(this);
    this._underlying.onopenarray = this._onopenarray.bind(this);
    this._underlying.onclosearray = this._onclosearray.bind(this);
    this._underlying.onend = this._onend.bind(this);
  }

  _maybeEmit(value) {
    var wasMatching = this.matching();
    var key = this._stack.pop();
    var isMatching = this.matching();

    var emitValue = wasMatching && !isMatching;
    if (emitValue) {
      this.push(value);
    }
    this._stack.push(key);
    return emitValue;
  }

  _pushArrayKey(key) {
    if(key && key === '*') this._stack.push(key);
  }

  _popNonArrayKey() {
    var key = _.last(this._stack);
    if(key && key !== '*') this._stack.pop();
  }

  _onvalue(value) {
    var fn = this._state.pop();
    if(fn) fn(value);
  }

  _onopenobject(firstKey) {
    var obj = {};
    this._state.push(() => {
      var fn = this._state.pop();
      if(fn) fn(obj);
    });
    this._state.push((key, value) => {
      obj[key] = value;
      this._maybeEmit(value);
    });
    this._onkey(firstKey);
  }

  _onkey(key) {
    this._stack.push(key);
    if(!this.matching()) {
      return this._state.push((value) => {
        this._stack.pop(); //ignore the value because not matching
      });
    }
    this._state.push((value) => {
      _.last(this._state)(key, value); // get to the obj setter
      var e = this._stack.pop();
      if(e !== key) throw new Error("Invalid keys!");
    });
  }

  _oncloseobject() {
    this._state.pop(); // pop the obj setter
    this._state.pop()(); // add the object to the parent
  }

  _onopenarray() {
    var arr = [];
    this._state.push(() => {
      var fn = this._state.pop();
      if(fn) return fn(arr);
      this._maybeEmit(arr);
    });
    this._stack.push('*');
    var pusher = (value) => {
      arr.push(value);
      this._maybeEmit(value);
      this._state.push(pusher);
    };
    this._state.push(pusher);
  }
  _onclosearray() {
    this._state.pop(); // pop the array pusher
    var e = this._stack.pop();
    if(e !== "*") throw new Error("Invalid array key");
    this._state.pop()();
  }

  _onend() {
    this.emit('end');
  }

  inArray() {
    return this._arrStack.length > 0;
  }

  inNestedArray() {
    return this.inArray() && this._arrStack.length > 1;
  }

  matching() {
    for (var p in this._desiredPath) {
      if (this._desiredPath[p] !== this._stack[p]) {
        return false;
      }
    }
    return true;
  }

  _onerror(e) {
    this.emit('error', e);
  }

  _write(chunk, encoding, cb) {
    this._underlying.write(chunk.toString());
    cb();
  }

  _flush() {
    this._underlying.close();
  }
}

export default Parser;