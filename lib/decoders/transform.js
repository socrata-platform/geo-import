import {types} from '../soql/mapper';
import logger from '../util/logger';

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


function propToSoQL(name, value) {
  var t = types[typeof value];
  if(!t) {
    logger.warn(`Invalid property type ${typeof value}`);
    return false;
  }
  return new t(name, value);
}

function geomToSoQL(geom) {
  var ctype = geom.type.toLowerCase();
  var t = types[ctype];
  if (!t) {
    logger.error(`Invalid geometry type ${ctype} ${types} are the types available`);
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

export {toRow as toRow, geomToSoQL as geomToSoQL, propToSoQL as propToSoQL, geoJsToSoQL as geoJsToSoQL};