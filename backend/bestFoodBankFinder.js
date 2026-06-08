/**
 * ###############################################################################
 * 
 * File        : bestFoodBankFinder.js
 * 
 * Date        : Wednesday 3rd June 2026
 * 
 * Author      : Liam Pochin
 * 
 * Description : Loads foodBankData.json to find the shortest walking distance
 *               food bank with the most user-specified items in surplus.
 *  
 * History     : 03/06/2026 - v1.0
 * 
 * ###############################################################################
 */

const fs = require('fs/promises');
const { getWalkingDistanceAndTime, haversineDistance } = require('./distance');

// Module-level cache so we don't re-read the JSON file on every request.
let cachedBanks = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

async function loadData(data_path) {
  const now = Date.now();
  if (cachedBanks && (now - cacheTimestamp) < CACHE_TTL_MS) {
    return cachedBanks;
  }

  try {
    const raw_data = await fs.readFile(data_path, 'utf8');
    const banks = JSON.parse(raw_data).map(bank => ({
      ...bank,
      latitude: Number(bank.latitude),
      longitude: Number(bank.longitude),
      excess: typeof bank.excess === 'string' && bank.excess.trim()
        ? bank.excess.split(', ')
        : [],
      needs: typeof bank.needs === 'string' && bank.needs.trim()
        ? bank.needs.split(', ')
        : []
    }));

    cachedBanks = banks;
    cacheTimestamp = now;
    return banks;
  } catch (error) {
    console.error('Failed to load food bank data:', error.message);
    return cachedBanks || [];
  }
}

class bestFoodBankFinder {
  constructor({
    data_path = 'backend/data/food-bank-data.json' } = {}) {
    this.data_path = data_path;
  }

  // Return the best-matching bank or null; lower score is better.
  async findBest(user_lat, user_lon, preferences = []) {
    const food_banks = await loadData(this.data_path);

    if (!food_banks || food_banks.length === 0) {
      return null;
    }

    // 1. Calculate straight-line distances (fast, no network) for all banks.
    const banksWithStraightLine = food_banks.map(bank => ({
      ...bank,
      straightLineDistance: haversineDistance(
        Number(user_lat), Number(user_lon),
        Number(bank.latitude), Number(bank.longitude)
      )
    }));

    // 2. Sort by straight-line distance and only fetch OSRM walking distance
    //    for the 5 closest candidates. This avoids 10 sequential network calls.
    const closestCandidates = banksWithStraightLine
      .sort((a, b) => a.straightLineDistance - b.straightLineDistance)
      .slice(0, 5);

    // 3. Fetch walking distances in PARALLEL for the closest candidates.
    const distanceMap = new Map();
    await Promise.all(
      closestCandidates.map(async (bank) => {
        try {
          const route = await getWalkingDistanceAndTime(
            Number(user_lat),
            Number(user_lon),
            Number(bank.latitude),
            Number(bank.longitude)
          );
          distanceMap.set(bank.id, route.distance);
        } catch (err) {
          console.log(bank.name + " couldn't get OSRM distance, using Haversine.");
          distanceMap.set(bank.id, bank.straightLineDistance * 1.3);
        }
      })
    );

    // 4. Score all banks (closest 5 get OSRM distance, rest get Haversine estimate).
    let best_match = null;
    let lowest_score = Infinity;

    for (const bank of banksWithStraightLine) {
      const distance = distanceMap.has(bank.id)
        ? distanceMap.get(bank.id)
        : bank.straightLineDistance * 1.3;

      let calculated_score = Number.isFinite(distance)
        ? distance
        : Infinity;

      const bank_excess = bank.excess || [];
      const bank_needs = bank.needs || [];

      for (const item of preferences) {
        if (bank_excess.includes(item)) {
          calculated_score -= 300;
        } else if (bank_needs.includes(item)) {
          calculated_score += 600;
        }
      }

      if (calculated_score < lowest_score) {
        lowest_score = calculated_score;
        best_match = { ...bank, distance };
      }
    }

    // Strip internal field from the returned object
    const { straightLineDistance, ...result } = best_match;
    return result;
  }
}

module.exports = { bestFoodBankFinder };