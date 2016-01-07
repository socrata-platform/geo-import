/**
 * Layer is a 1:1 mapping to a dataset. It has a set
 * schema. On creation, it opens a temp file
 * and will flush features (SoQLValues) to it as they're written
 * to the layer.
 */
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }; })();

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _underscore = require('underscore');

var _underscore2 = _interopRequireDefault(_underscore);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _eventStream = require('event-stream');

var _eventStream2 = _interopRequireDefault(_eventStream);

var _uuid = require('uuid');

var _uuid2 = _interopRequireDefault(_uuid);

var _events = require('events');

var _ldjsonStream = require('ldjson-stream');

var _ldjsonStream2 = _interopRequireDefault(_ldjsonStream);

var _nodeSrs = require('node-srs');

var _nodeSrs2 = _interopRequireDefault(_nodeSrs);

var _utilBbox = require('../util/bbox');

var _utilBbox2 = _interopRequireDefault(_utilBbox);

var _stream = require('stream');

var _soqlMapper = require('../soql/mapper');

var _utilLogger = require('../util/logger');

var _utilLogger2 = _interopRequireDefault(_utilLogger);

var _config = require('../config');

var _config2 = _interopRequireDefault(_config);

var config = (0, _config2['default'])();
var scratchPrologue = "";
var scratchSeparator = "\n";
var scratchEpilogue = "";

var jsonPrologue = "[";
var jsonSeparator = ",";
var jsonEpilogue = "]";

var WGS84 = '+proj=longlat +ellps=WGS84 +no_defs';

var Layer = (function (_Duplex) {
  _inherits(Layer, _Duplex);

  _createClass(Layer, null, [{
    key: 'EMPTY',
    get: function get() {
      return '__empty__';
    }
  }]);

  function Layer(columns, position, disk, spec) {
    _classCallCheck(this, Layer);

    if (position === undefined) throw new Error("Need a layer index!");
    _get(Object.getPrototypeOf(Layer.prototype), 'constructor', this).call(this);
    this._position = position;

    this.columns = columns;
    this._count = 0;
    this._crsMap = {};
    this._projectTo = _nodeSrs2['default'].parse(WGS84);
    this._spec = spec || {};

    this._bbox = new _utilBbox2['default']();

    if (disk) {
      this._outName = '/tmp/import_' + _uuid2['default'].v4() + '.ldjson';
      this._out = disk.allocate(this._outName);
      this._out.write(scratchPrologue);
    }
  }

  _createClass(Layer, [{
    key: 'toJSON',
    value: function toJSON() {
      return {
        count: this.count,
        projection: this.defaultCrs.name,
        name: this.name,
        geometry: this.geomType,
        bbox: this._bbox.toJSON(),
        columns: this.columns.map(function (c) {
          return c.toJSON();
        })
      };
    }
  }, {
    key: 'belongsIn',
    value: function belongsIn(soqlRow) {
      for (var i = 0; i < this.columns.length; i++) {
        var column = this.columns[i];
        var soqlValue = soqlRow[i];

        var nameMatch = column.rawName === soqlValue.rawName;
        if (!nameMatch) return false;

        var typeMatch = column.ctype === soqlValue.ctype;
        var isEmpty = column.ctype === 'null' || soqlValue.ctype === 'null';
        if (!typeMatch && !isEmpty) return false;
      }
      return true;
    }
  }, {
    key: '_updateColumnTypes',

    /**
     * Layers are created on the fly. They are created when we encounter the
     * a soqlRow which does not fit in the set of layers that we know about.
     * _updateColumnTypes mutates the Layer's column types as values that
     * have more type info are written to it.
     *
     * An Example:
     *   A dataset is being read which looks like
     *   [
     *     ['a', 1, POINT(1, 2), null],
     *     ['b', 1, POINT(2, 3), 'something']
     *     ['c', 1, POINT(3, 4), null]
     *   ]
     *
     *
     *   When we encounter the first row, a Layer, layer0, is created with the first soqlRow:
     *     ['a', 1, POINT(1, 2), null]
     *   So we end up with layer0 that has columns of type
     *     [SoQLText, SoQLNumber, SoQLPoint, SoQLNull]
     *
     *   Then we encounter the second row, row1, which has more info about what the last
     *   column actually is.
     *     ['b', 1, POINT(2, 3), 'something']
     *   layer0.belongsIn(row1) will return true, so row1 will get written to layer0.
     *   layer0.write will call _updateColumnTypes to update its undefined columns to reflect
     *   the fact that it is now storing values with more type info than it had before.
     *
     * This is a little confusing and gross, and comes from the fact that this is
     * being written to the lowest common denominator (geoJSON, KML, KMZ) of type
     * info. ESRI shapefiles give more hints about types, though all those hints
     * are eliminated in the shapefile library being used.
     *
     * This could be written as a big map, but it is called on every write,
     * so it's important to return as early as possible.
     *
     * @mutates this.columns
     */
    value: function _updateColumnTypes(soqlRow) {
      var undefinedColumns = this.columns.filter(function (c) {
        return c.ctype === 'null';
      });
      if (!undefinedColumns.length) return;

      var definedSoqlCols = soqlRow.filter(function (c) {
        return c.ctype !== 'null';
      });
      //We want the set of columns that are defined for the value, but are not defined
      //for the layer. These are the columns that we will replace in the layer.
      var toAdd = definedSoqlCols.filter(function (valCol) {
        return _underscore2['default'].find(undefinedColumns, function (col) {
          return valCol.rawName === col.rawName;
        });
      });

      if (toAdd.length === 0) return;

      this.columns = this.columns.map(function (col) {
        var valCol = _underscore2['default'].find(toAdd, function (newCol) {
          return newCol.rawName === col.rawName;
        });
        var newCol;
        if (valCol) {
          newCol = new valCol.constructor(valCol.rawName);
          _utilLogger2['default'].debug('Replacing old undefined column ' + valCol.rawName + ' with new ' + valCol.constructor.name + ' column');
        }
        return newCol || col;
      });
    }

    /**
     * Write the soqlRow with a given crs to the layer.
     * This will only be called if belongsIn returned true for the soqlRow and this layer.
     * See the note above on the confusing mutate-y  bits.
     * @param  {[type]} crs       [description]
     * @param  {[type]} soqlRow   [description]
     * @param  {[type]} throwaway [description]
     * @return {[type]}           [description]
     */
  }, {
    key: 'write',
    value: function write(crs, soqlRow, throwaway, done) {
      if (crs) this._crsMap[this._count] = crs;

      this._updateColumnTypes(soqlRow);
      this._count++;
      if (throwaway) {
        if (done) done();
        return;
      }

      this._out.write(this._scratchSeparator(this._count) + JSON.stringify(soqlRow.map(function (r) {
        return r.value;
      })) + '\n', null, done);
    }
  }, {
    key: '_scratchSeparator',
    value: function _scratchSeparator(index) {
      return index === 0 ? '' : scratchSeparator;
    }
  }, {
    key: '_jsonSeparator',
    value: function _jsonSeparator(index) {
      return index === 0 ? '' : jsonSeparator;
    }
  }, {
    key: 'close',
    value: function close(cb) {
      var _this = this;

      this._out.write(scratchEpilogue, null, function () {
        _this._out.on('finish', function () {
          _this.emit('readable');
          _this._emittedReadable = true;
          cb();
        });
        _this._out.end();
      });
    }
  }, {
    key: '_expandBbox',
    value: function _expandBbox(geom) {
      var _this2 = this;

      //yes a map is silly here because this is a side effect on the layer
      //but it keeps things simple
      geom.mapCoordinates(function (coord) {
        _this2._bbox.expand(coord);
      });
    }
  }, {
    key: '_getProjectionFor',
    value: function _getProjectionFor(index) {
      if (!this._crsMap[index]) return this.defaultCrs;
      return _nodeSrs2['default'].parse(this._crsMap[index]);
    }
  }, {
    key: '_startPushing',
    value: function _startPushing() {
      this._isPushing = true;
      var projectTo = this._projectTo;
      var index = 0;
      var self = this;
      this.push(jsonPrologue);
      _fs2['default'].createReadStream(this._outName).pipe(_ldjsonStream2['default'].parse({
        highWaterMark: _config2['default'].rowBufferSize
      })).pipe(_eventStream2['default'].through(function write(row) {
        var soqlRow = _underscore2['default'].zip(self.columns, row).map(function (_ref) {
          var _ref2 = _slicedToArray(_ref, 2);

          var column = _ref2[0];
          var value = _ref2[1];

          var soql = new _soqlMapper.types[column.ctype](column.rawName, value);
          if (soql.isGeometry) {
            var projection = self._getProjectionFor(index);
            var geom = soql.reproject(projection, projectTo);
            self._expandBbox(geom);
            return geom;
          }
          return soql;
        });

        var sep = self._jsonSeparator(index);
        var ep = '';
        index++;
        if (index === self._count) ep = jsonEpilogue;

        var asSoda = soqlRow.reduce(function (acc, col) {
          acc[col.name] = col.value;
          return acc;
        }, {});

        var rowString = sep + JSON.stringify(asSoda) + ep;

        if (!self.push(rowString)) {
          this.pause();
          self._readableState.pipes.once('drain', this.resume.bind(this));
        }
      }, function end() {
        self.push(null);
      }));
    }

    /**
      Read the rows back out from the scratch file that was written
      as their SoQL reps, and reproject them into WGS84
       @sideeffect: update the layer's _bbox property after the geometry
                   is reprojected. this expands the bbox if the geometry
                   lies outside of the bbox. After all features have been
                   read then _bbox will encompass all of them
    */
  }, {
    key: '_read',
    value: function _read() {
      if (!this._emittedReadable && !this._isPushing) {
        this.once('readable', this._startPushing.bind(this));
      } else if (!this._isPushing) {
        this._startPushing();
      }
    }
  }, {
    key: 'scratchName',
    get: function get() {
      return this._outName;
    }
  }, {
    key: 'name',
    get: function get() {
      return this._spec.name || 'layer_' + this._position;
    }
  }, {
    key: 'uid',
    get: function get() {
      return this._spec.uid || Layer.EMPTY;
    },
    set: function set(uid) {
      this._spec.uid = uid;
      return this;
    }
  }, {
    key: 'geomType',
    get: function get() {
      var geom = _underscore2['default'].find(this.columns, function (col) {
        return col.isGeometry;
      });
      if (!geom) return null;
      return geom.dataTypeName;
    }
  }, {
    key: 'defaultCrs',
    set: function set(urn) {
      this._defaultCrs = _nodeSrs2['default'].parse(urn);
    },
    get: function get() {
      return this._defaultCrs || this._projectTo;
    }
  }, {
    key: 'projections',
    get: function get() {
      return Object.values(this._crsMap);
    }
  }, {
    key: 'count',
    get: function get() {
      return this._count;
    }
  }]);

  return Layer;
})(_stream.Duplex);

exports['default'] = Layer;
module.exports = exports['default'];