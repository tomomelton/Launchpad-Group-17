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
const { getWalkingDistanceAndTime } = require('./distance');

class bestFoodBankFinder {
  constructor({ 
    data_path = 'backend/data/food-bank-data.json',
    update_script = './updateJson.js' } = {}) {
    this.data_path = data_path;
    this.update_script = update_script;
    this.food_banks = [];
  }

  // Load JSON data into this.food_banks; on error preserve an empty array.
  async loadData() {
    try {
      const raw_data = await fs.readFile(this.data_path, 'utf8');
      this.food_banks = JSON.parse(raw_data).map(bank => ({
        ...bank,
        latitude: Number(bank.latitude),
        longitude: Number(bank.longitude)
      }));

    } catch (error) {
      console.error('Failed to load food bank data:', error.message);
      this.food_banks = [];
    }
  }

  // Run external update script; failure is non-fatal (use existing data).
  runUpdateScript() {
    try {
      require(this.update_script);
    } catch (err) {
      console.warn('Update script failed, using existing data.');
    }
  }

  // Return the best-matching bank or null; lower score is better.
  async findBest(user_lat, user_lon, preferences = []) {
    await this.runUpdateScript();
    await this.loadData();

    if (!this.food_banks || this.food_banks.length === 0) {
      return null;
    }

    let best_match = this.food_banks[0];
    let lowest_score = Infinity;

    for (const bank of this.food_banks) {

      try {

        const route = await getWalkingDistanceAndTime(
          Number(user_lat), 
          Number(user_lon), 
          Number(bank.latitude), 
          Number(bank.longitude)
        );
          bank.distance = route.distance;
      } catch (err) {
        bank.distance = Infinity;
        console.log(bank.name + " couldn't get distance.");
      }

      /* Treat missing distance as very far. Mean human walking speed is 
      ~ 1.34 m/s. */
      let calculated_score = Number.isFinite(bank.distance / 1.34) 
        ? bank.distance 
        : Infinity; 

      const bank_excess = Array.isArray(bank.excess) ? bank.excess : [];
      const bank_needs = Array.isArray(bank.needs) ? bank.needs : [];

      /* Preference scoring using seconds as the common unit: surplus reduces 
      score, need increases it. */
      for (const item of preferences) {
        if (bank_excess.includes(item)) {
          calculated_score -= 300;
        } else if (bank_needs.includes(item)) {
          calculated_score += 600;
        }
      }

      if (calculated_score < lowest_score) {
        lowest_score = calculated_score;
        best_match = bank;
      }
    }

    return best_match;
  }

}

module.exports = { bestFoodBankFinder };