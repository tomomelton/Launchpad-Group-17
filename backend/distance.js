/**
 * ###############################################################################
 * 
 * File        : distance.js
 * 
 * Date        : Thursday 4th June 2026
 * 
 * Author      : Alan Popielas
 * 
 * Description : Provides a function to calculate the walking distance and time between
 *              two sets of co-ordinates using the OSRM API (with Haversine fallback).
 *  
 * History     : 04/06/2026 - v1.0
 * 
 * ###############################################################################
 */

/**
 * Calculates straight-line (Haversine) distance between two points in meters.
 * Used as a fallback if the routing API is unavailable.
 * 
 * @param {number} lat1 Latitude of point 1
 * @param {number} lon1 Longitude of point 1
 * @param {number} lat2 Latitude of point 2
 * @param {number} lon2 Longitude of point 2
 * @returns {number} Distance in meters
 */
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
            Math.cos(phi1) * Math.cos(phi2) *
            Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
            
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Estimates walking time in seconds based on distance and average speed.
 * Average walking speed is roughly 1.34 m/s (approx 4.8 km/h or 3 mph).
 * 
 * @param {number} distanceInMeters 
 * @returns {number} Estimated walking duration in seconds
 */
function estimateWalkingTime(distanceInMeters) {
  const walkingSpeed = 1.34; // m/s
  return Math.round(distanceInMeters / walkingSpeed);
}

/**
 * Calculates walking distance and time between two sets of coordinates.
 * Attempts to query the Open Source Routing Machine (OSRM) API for precise route,
 * and falls back to a Haversine straight-line estimation if the network request fails.
 * 
 * Note: While the original specification mentioned the Overpass API, Overpass is a data 
 * querying service and cannot calculate routes. OSRM is the standard OSM routing engine.
 * 
 * @param {number} lat1 Latitude of starting point
 * @param {number} lon1 Longitude of starting point
 * @param {number} lat2 Latitude of destination point
 * @param {number} lon2 Longitude of destination point
 * @returns {Promise<{distance: number, duration: number, isEstimated: boolean}>} 
 *          Object containing walking distance (meters), duration (seconds), and estimation flag
 */
async function getWalkingDistanceAndTime(lat1, lon1, lat2, lon2) {
  // Validate inputs
  if (
    typeof lat1 !== 'number' || typeof lon1 !== 'number' ||
    typeof lat2 !== 'number' || typeof lon2 !== 'number' ||
    isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)
  ) {
    throw new Error("Invalid coordinates provided. Coordinates must be valid numbers.");
  }

  // OSRM coordinates are specified as longitude,latitude
  const url = `https://router.project-osrm.org/route/v1/foot/${lon1},${lat1};${lon2},${lat2}?overview=false`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`OSRM API responded with status ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      return {
        distance: route.distance, // in meters
        duration: route.duration, // in seconds
        isEstimated: false
      };
    } else {
      throw new Error(`OSRM routing failed with code: ${data.code}`);
    }
  } catch (error) {
    console.warn(`Routing API failed (${error.message}). Falling back to Haversine estimate.`);
    
    // Fallback to straight-line distance with standard detour factor (usually 1.3 for city street grids)
    const straightLineDistance = haversineDistance(lat1, lon1, lat2, lon2);
    const estimatedStreetDistance = straightLineDistance * 1.3;
    const estimatedDuration = estimateWalkingTime(estimatedStreetDistance);

    return {
      distance: Math.round(estimatedStreetDistance),
      duration: estimatedDuration,
      isEstimated: true
    };
  }
}

module.exports = {
  getWalkingDistanceAndTime,
  haversineDistance
};