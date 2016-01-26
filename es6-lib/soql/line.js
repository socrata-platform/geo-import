import SoQLGeom from './geom';

class SoQLLine extends SoQLGeom {
  get _type() {
    return 'LineString';
  }


  static ctype() {
    return 'linestring';
  }

  //[[x,y]] will become [[x,y],[x,y]] because the java
  //lib used in soda-fountain throws an exception if a line
  //is just a point
  static linify(line) {
    if (line.length < 2) {
      line.push(line[0]);
    }
    return line;
  }

  fixSemantics() {
    this._value = SoQLLine.linify(this._value);
    return this;
  }

  mapCoordinates(fn) {
    return this._value.map(fn);
  }

  get vertexCount() {
    return this._value.length;
  }
}

module.exports = SoQLLine;