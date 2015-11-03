import GeoJSON from './geojson';

function getDecoder(req) {
  return new GeoJSON();
}

export default getDecoder;