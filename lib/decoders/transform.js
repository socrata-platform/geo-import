import {types} from '../soql/mapper';


function propToSoQL(name, value) {
  var t = types[typeof value];
  if(!t) {
    console.error("Invalid property type", typeof value);
    return false;
  }
  return new t(name, value);
}

function geomToSoQL(geom) {
  var ctype = geom.type.toLowerCase();
  var t = types[ctype];
  if (!t) {
    console.error("Invalid geometry type", ctype, types, "are the types available");
    return false;
  }
  return new t("the_geom", geom);
}

function toRow(geometry, geomToSoQL, properties, propToSoQL, crs) {
  var soqlGeom = geomToSoQL(geometry);

  var soqlProps = [];
  if (properties) {
    soqlProps = Object.keys(properties).map(function(name) {
      return propToSoQL(name, properties[name]);
    });
  }

  return {columns: [soqlGeom].concat(soqlProps), crs: crs};
}

export {toRow as toRow, geomToSoQL as geomToSoQL, propToSoQL as propToSoQL}