const MIN_LONGITUDE = -180;
const MAX_LONGITUDE = 180;
const MIN_LATITUDE = -90;
const MAX_LATITUDE = 90;

class BBox {
  constructor() {
    this._coords = {
      minx: Infinity,
      miny: Infinity,
      maxx: -Infinity,
      maxy: -Infinity
    };
  }

  toJSON() {
    return this._coords;
  }

  toString() {
    const {
      minx, miny, maxx, maxy
    } = this.toJSON();
    return `${minx},${miny},${maxx},${maxy}`;
  }

  get maxx() {
    return this._coords.maxx;
  }
  get maxy() {
    return this._coords.maxy;
  }
  get minx() {
    return this._coords.minx;
  }
  get miny() {
    return this._coords.miny;
  }

  _isValid(coord) {
    if (!coord) return false;
    if (coord.length !== 2) return false;

    const [x, y] = coord;
    var validMinX = x >= MIN_LONGITUDE;
    var validMaxX = x <= MAX_LONGITUDE;

    var validMinY = y >= MIN_LATITUDE;
    var validMaxY = y <= MAX_LATITUDE;
    return validMinX && validMinY && validMinY && validMaxY;
  }

  merge(bbox) {
    this._coords.minx = Math.min(bbox.minx, this._coords.minx);
    this._coords.miny = Math.min(bbox.miny, this._coords.miny);

    this._coords.maxx = Math.max(bbox.maxx, this._coords.maxx);
    this._coords.maxy = Math.max(bbox.maxy, this._coords.maxy);

    return this;
  }

  expand(coord) {
    if (!this._isValid(coord)) return this;

    var [x, y] = coord;

    this._coords.minx = Math.min(x, this._coords.minx);
    this._coords.miny = Math.min(y, this._coords.miny);

    this._coords.maxx = Math.max(x, this._coords.maxx);
    this._coords.maxy = Math.max(y, this._coords.maxy);

    return this;
  }
}

export default BBox;
