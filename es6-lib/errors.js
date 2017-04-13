import changeCase from 'change-case';
import config from './config';
import _ from 'underscore';

const conf = config();

class ImportError extends Error {
  params() {
    return {};
  }

  upstream() {
    return {};
  }

  static reason() {
    return changeCase.paramCase(this.name);
  }

  static title() {
    return changeCase.titleCase(this.reason());
  }

  toJSON() {
    return {
      eventType: this.constructor.reason(),
      info: _.extend({
        english: this.english(),
      }, this.params())
    };
  }

  english() {
    return _.pairs(this.params()).reduce((acc, [k, v]) => {
      return acc.replace(`{${k}}`, v);
    }, this.constructor.template());
  }
}

class ZKError extends ImportError {
  constructor(reason) {
    super();
    this._reason = reason;
  }

  status() {
    return 502;
  }

  params() {
    return {
      reason: this._reason
    };
  }

  static template() {
    return 'There was an upstream error: {reason}';
  }
}

class VertexTooComplexError extends ImportError {

  constructor(counted, rowNum) {
    super();
    this._counted = counted;
    this._rowNum = rowNum;
  }

  status() {
    return 400;
  }

  params() {
    return {
      counted: this._counted,
      rowNum: this._rowNum,
      maxVerticesPerRow: conf.maxVerticesPerRow
    };
  }

  static template() {
    return 'There were {counted} vertices in row {rowNum}, the max is {maxVerticesPerRow}';
  }
}

class IOError extends ImportError {
  constructor(reason) {
    super();
    this._reason = reason;
  }

  params() {
    return {
      reason: this._reason
    };
  }

  status() {
    return 400;
  }
}

class ShapefileHeaderError extends IOError {
  static template() {
    return 'Failed to read the header in the shapefile: {reason}';
  }
}

class ShapefileRowError extends IOError {
  static template() {
    return 'Failed to read a row in the shapefile: {reason}';
  }
}

class ArchiveError extends IOError {
  static template() {
    return 'Failed to open the zip archive: {reason}';
  }
}

class CorruptShapefileError extends IOError {
  static template() {
    return 'Failed to read the shapefile: {reason}';
  }
}

class DecodeFiletypeError extends IOError {
  constructor(kind) {
    super();
    this._kind = kind;
  }

  params() {
    return {
      kind: this._kind
    };
  }

  status() {
    return 400;
  }

  static template() {
    return 'No decoder found for {kind}';
  }
}

class IncompleteShapefileError extends ImportError {
  constructor(missing) {
    super();
    this._missing = missing;
  }

  status() {
    return 400;
  }

  params() {
    return {
      missing: this._missing.join(', ')
    };
  }

  static template() {
    return 'Your shapefile archive is incomplete. It must contain a .dbf, .shp, and .prj file for every layer. Expected it to contain the following files, which were actually missing: {missing}.';
  }
}

class XMLParseError extends ImportError {
  constructor(reason, path) {
    super();
    this._reason = reason;
    this._path = path;
  }

  params() {
    return {
      reason: this._reason,
      path: this._path
    };
  }

  static template() {
    return 'Failed to parse XML node due to {reason} near {path}';
  }
}

class JSONParseError extends ImportError {
  constructor(reason, line, column, token) {
    super();
    this._reason = reason;
    this._line = line;
    this._column = column;
    this._token = token;
  }

  params() {
    return {
      reason: this._reason,
      column: this._column,
      line: this._line,
      token: this._token
    };
  }

  static template() {
    return 'Failed to parse JSON at line {line} column {column} token {token} because {reason}';
  }
}

class InvalidArityError extends ImportError {
  constructor(row) {
    super();
    this._row = row;
  }

  params() {
    return {
      row: JSON.stringify(this._row.map(column => column.value))
    };
  }

  static template() {
    return 'One of the points in the following row did not have 2 coordinates {row}';
  }
}

class UpstreamError extends ImportError {
  constructor(status, response) {
    super();
    this._upstreamStatus = status;
    this._response = response;
  }

  status() {
    return 502;
  }

  params() {
    return {
      message: this.upstream().response.message? `: ${this.upstream().response.message}` : ''
    }
  }

  toJSON() {
    var js = super.toJSON();
    js.info.upstream = this.upstream();
    return js;
  }

  upstream() {
    return {
      response: this._response,
      status: this._upstreamStatus
    };
  }
}

class ConnectionError extends IOError {
  static template() {
    return 'Failed to connect to that service {reason}';
  }
}

class CreateDatasetError extends UpstreamError {
  static template() {
    return 'Failed to create a dataset{message}';
  }
}
class CreateWorkingCopyError extends UpstreamError {
  static template() {
    return 'Failed to create a working copy{message}';
  }
}
class PublicationError extends UpstreamError {
  static template() {
    return 'Failed to publish that dataset{message}';
  }
}
class CreateColumnError extends UpstreamError {
  static template() {
    return 'Failed to create a dataset{message}';
  }
}
class GetColumnError extends UpstreamError {
  static template() {
    return 'Failed to get the columns of that dataset{message}';
  }
}
class DeleteColumnError extends UpstreamError {
  static template() {
    return 'Failed to delete a column of that dataset{message}';
  }
}
class SetBlobError extends UpstreamError {
  static template() {
    return 'Failed to set the file data attribute of that dataset{message}';
  }
}
class UpdateMetadataError extends UpstreamError {
  static template() {
    return 'Failed to update the metadata on the partent dataset{message}';
  }
}
class UpsertError extends UpstreamError {
  static template() {
    return 'Failed to upsert the dataset{message}';
  }
}
class CleanupError extends UpstreamError {
  static template() {
    return 'Encountered an error, but encountered another error rolling back{message}';
  }
}

export
default {
  ZKError,
  CreateDatasetError,
  CreateWorkingCopyError,
  CreateColumnError,
  PublicationError,
  GetColumnError,
  DeleteColumnError,
  UpdateMetadataError,
  UpsertError,
  CleanupError,
  VertexTooComplexError,
  ShapefileHeaderError,
  ShapefileRowError,
  ArchiveError,
  XMLParseError,
  JSONParseError,
  InvalidArityError,
  CorruptShapefileError,
  IncompleteShapefileError,
  DecodeFiletypeError,
  ConnectionError,
  SetBlobError
};
