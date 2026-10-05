const appConfig = require('../config/appConfig');

const EARTH_RADIUS_KM = 6371;

function toRadians(deg) {
  return (deg * Math.PI) / 180;
}

/**
 * Haversine distance between two [lng, lat] points, in kilometers.
 */
function distanceKm([lng1, lat1], [lng2, lat2]) {
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

/**
 * Rounds coordinates to a coarse precision so we never persist an exact
 * residential address - only an approximate location suitable for matching.
 */
function toApproximateCoordinates(lng, lat) {
  const decimals = appConfig.location.coordinatePrecisionDecimals;
  const factor = 10 ** decimals;
  return [Math.round(lng * factor) / factor, Math.round(lat * factor) / factor];
}

module.exports = { distanceKm, toApproximateCoordinates };
