
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

  merge(bbox) {
    this._coords.minx = Math.min(bbox.minx, this._coords.minx);
    this._coords.miny = Math.min(bbox.miny, this._coords.miny);

    this._coords.maxx = Math.max(bbox.maxx, this._coords.maxx);
    this._coords.maxy = Math.max(bbox.maxy, this._coords.maxy);

    return this;
  }

  expand([x, y]) {
    this._coords.minx = Math.min(x, this._coords.minx);
    this._coords.miny = Math.min(y, this._coords.miny);

    this._coords.maxx = Math.max(x, this._coords.maxx);
    this._coords.maxy = Math.max(y, this._coords.maxy);

    return this;
  }
}

export default BBox;