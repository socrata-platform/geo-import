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
    this._stack.push(key);

    /**
     * We only emit values when we encounter a
     * value that lives on the boundary of
     * the path we are watching.
     *
     * So in this case if we are watching for "foo"
     * {"foo": {"bar": {"baz" : 1}}}
     *
     * Then close object of bar will pop bar off the stack
     * so we will still be matching, so we won't emit a value
     *
     * But the next close object (closing the `foo` object)
     * will pop `foo` so we won't be matching anymore, causing
     * a push, so {"bar": {"baz" : 1}} will be pushed
     */
    var emitValue = wasMatching && !isMatching;
    if (emitValue) this.push(value);
    return emitValue;
  }

  _onvalue(value) {
    var fn = this._state.pop();
    if (fn) fn(value);
  }

  _onopenobject(firstKey) {
    var obj = {};
    this._state.push(() => {
      var fn = this._state.pop();
      if (fn) fn(obj);
    });
    this._state.push((key, value) => {
      obj[key] = value;
      this._maybeEmit(value);
    });
    this._onkey(firstKey);
  }

  _onkey(key) {
    this._stack.push(key);
    var pusher;
    /**
     * If we're not matching, then the function in the state
     * that gets called when a value is encountered just
     * throws away the value and pops the key off the stack
     *
     * If we are matching, then the function in the state that
     * gets called when a value is encountered will call the
     * last setter in the state stack with the `key` and
     * the `value` encountered
     */
    if (!this.matching()) {
      pusher = (unused) => {
        var e = this._stack.pop(); //ignore the value because not matching
        if (e !== key) throw new Error("Invalid keys! (unused)");
      };
    } else {
      pusher = (value) => {
        // get to the obj setter because this fn has been popped
        _.last(this._state)(key, value);
        var e = this._stack.pop();
        if (e !== key) throw new Error("Invalid keys!");
      };
    }
    this._state.push(pusher);
  }

  _oncloseobject() {
    this._state.pop(); // pop the obj setter
    this._state.pop()(); // add the object to the parent
  }

  _onopenarray() {
    var arr = [];
    var parent;
    var pusher;

    /**
     * If we open an array in a path
     * that we aren't matching, then we
     * don't want to accumulate any elements
     * within it. They can still get emitted
     * if something within them matches, but
     * we don't want to push them into `arr`
     * because `arr` will never be used.
     * Therefore, the parent state will
     * not be emitting anything, and
     * the pusher function will not be pushing
     * anything for each item encountered in the
     * array
     */
    if (!this.matching()) {
      parent = () => {
        var fn = this._state.pop();
        if (fn) return fn(arr);
      };
      pusher = (value) => {
        this._maybeEmit(value);
        this._state.push(pusher);
      };
    } else {
      parent = () => {
        var fn = this._state.pop();
        if (fn) return fn(arr);
        this._maybeEmit(arr);
      };
      pusher = (value) => {
        arr.push(value);
        this._maybeEmit(value);
        this._state.push(pusher);
      };
    }

    this._state.push(parent);
    this._stack.push('*');
    this._state.push(pusher);
  }

  _onclosearray() {
    this._state.pop(); // pop the array pusher
    var e = this._stack.pop();
    if (e !== "*") throw new Error("Invalid array key");
    this._state.pop()();
  }

  _onend() {
    this.emit('end');
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