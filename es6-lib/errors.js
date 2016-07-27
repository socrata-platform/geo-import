import _ from 'underscore';
import changeCase from 'change-case';

class ImportError {

  addParam(param) {
    this._params = _.extend({}, this._params, param);
  }

  serialize() {
    return {
      key: changeCase.snakeCase(this.constructor.name),
      parameters: this._params
    };
  }

  toString() {
    return JSON.stringify(this.serialize());
  }
}

export class InvalidProjection extends ImportError {
  constructor(input) {
    super();
    this.addParam({input});
  }
}
