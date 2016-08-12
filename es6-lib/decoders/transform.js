import {
  types
}
from '../soql/mapper';
import _ from 'underscore';
import SoQLNull from '../soql/null';
import logger from '../util/logger';

const GEOM_NAME = 'the_geom';
/**
  Turn the feature into a SoQLType. If no mapping exists, it will get filtered
  out of the pipe
*/
function geoJsToSoQL(feature, crs) {
  if (!feature.type || (feature.type.toLowerCase() !== 'feature')) {
    logger.warn(`Invalid feature props, omitting: ${feature}`);
    return false;
  }

  if (!feature.geometry) {
    logger.warn(`Invalid feature geometry, omitting: ${feature}`);
    return false;
  }

  if (feature.crs && !crs) {
    if (feature.crs.href) {
      logger.warn(`No support for linked CRS yet. Omitting feature: ${featre}`);
      return false;
    }
    crs = feature.crs.properties.name;
  }
  return toRow(feature.geometry, geomToSoQL, feature.properties, propToSoQL, crs);
}

function soqlTypeFor(value) {
  if(_.isDate(value)) return types.date;
  if(_.isArray(value)) return types.array;
  if(_.isNull(value)) return SoQLNull;
  return types[typeof value];
}


function propToSoQL(name, value) {
  var t = soqlTypeFor(value);
  if(!t) {
    logger.warn(`Invalid property ${name} type: ${typeof value} ${value}`);
    return false;
  }

  // HACK for EN-4531
  // cartoDB seems to take invalid geometries and put them in
  // an attribute column as text. it then names this column `the_geom`
  // which works in shapefiles because we have a .dbf file
  // file which can have a column named `the_geom` and .shp file,
  // which only gets renamed to `the_geom` when we merge the .shp and
  // .dbf files together. but that causes a clash. So this next
  // bit prohibits calling an attribute `the_geom` because we're
  // going to call the actual geometry that
  if(name.toLowerCase() === GEOM_NAME) {
    name = `invalid_${GEOM_NAME}`;
  }

  return new t(name, value);
}

function geomToSoQL(geom) {
  if (geom === null) return new SoQLNull(GEOM_NAME);
  var ctype = geom.type.toLowerCase();
  var t = types[ctype];
  if (!t) {
    logger.warn(`Invalid geom property, ${typeof value} ${value}`);
    return false;
  }
  return new t(GEOM_NAME, geom, {});
}

function toRow(geometry, geomToSoQL, properties, propToSoQL, crs) {
  var soqlGeom = geomToSoQL(geometry);
  var soqlProps = [];
  if (properties) {
    for (var k in properties) {
      soqlProps.push(propToSoQL(k, properties[k]));
    }
  }

  return {
    columns: [soqlGeom].concat(soqlProps),
    crs: crs
  };
}

export {
  toRow as toRow, geomToSoQL as geomToSoQL, propToSoQL as propToSoQL, geoJsToSoQL as geoJsToSoQL
};
