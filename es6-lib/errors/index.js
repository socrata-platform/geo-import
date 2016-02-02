import _ from 'underscore';
import changeCase from 'change-case';

class GeoError extends Error {

  constructor(parameters) {
    super();
    this._params = parameters || {};
    if (!_.every(this.required, (key) => !!this._params[key])) {
      throw new Error(`Missing required parameter for ${this.t} error!`);
    }
  }

  toString() {
    return JSON.stringify(this.toJSON());
  }

  get t() {
    return changeCase.snakeCase(this.constructor.name);
  }

  toJSON() {
    return _.extend({
      'type': this.t,
    }, this.parameters);
  }

  get parameters() {
    return this._params;
  }

  get statusCode() {
    return 400;
  }
}


class UninterpretableValue extends GeoError {
  get required() {
    return ['record', 'filename'];
  }
}

class CorruptShapefile extends GeoError {
  get required() {
    return ['filename'];
  }
}

class CorruptArchive extends GeoError {
  get required() {
    return ['reason'];
  }
}

class IncompleteArchive extends GeoError {
  get required() {
    return ['missing'];
  }
}

class ParseError extends GeoError {
  get required() {
    return ['lineNumber', 'reason'];
  }
}

class RecordTooLarge extends GeoError {
  get required() {
    return ['limit', 'nearRecord'];
  }
}

class UnknownFileType extends GeoError {
  get required() {
    return ['extension'];
  }
}

class BadResponseFromServer extends GeoError {
  get required() {
    return ['message'];
  }

  get statusCode() {
    return 503;
  }
}

class InternalError extends GeoError {
  get required() {
    return ['message'];
  }

  get statusCode() {
    return 500;
  }
}

export {
  UninterpretableValue,
  CorruptShapefile,
  CorruptArchive,
  IncompleteArchive,
  ParseError,
  RecordTooLarge,
  UnknownFileType,
  BadResponseFromServer,
  InternalError
};