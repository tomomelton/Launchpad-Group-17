/**
 * ###############################################################################
 * 
 * File        : updateJson.js
 * 
 * Date        : Tuesday 2nd June 2026
 * 
 * Author      : Antigravity AI (based on Tom Melton's Python version)
 * 
 * Description : To collect and clean data from the Give Food API and store it in
 *               the JSON file foodbankdata.json to be accessed within js.
 *               Replicates the functionality of updateJson.py in JavaScript/Node.js.
 * 
 * History     : 02/06/2026 - v1.00
 * 
 * ###############################################################################
 */

const fs = require('fs');

// Path variables
const API_URL = "https://www.givefood.org.uk/api/2/foodbanks/search/?address=Ladywood,%20Birmingham";
const OUTPUT_FILE = "backend/data/food-bank-data.json";

async function updateJson() {
  try {
    console.log("Fetching raw data from Give Food API...");
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const rawData = await response.json();
    console.log(`Successfully fetched ${rawData.length} records. Processing and cleaning data...`);

    // Compile and clean data, replicating updateJson.py logic exactly
    const cleanedData = rawData.map(item => {
      // 1. Keep id, name, postcode as is
      const id = item.id;
      const name = item.name || "";
      const postcode = item.postcode || "";

      // 2. Split latitude and longitude from lat_lng string e.g., "52.4818698,-1.91045"
      let latitude = null;
      let longitude = null;
      if (item.lat_lng && typeof item.lat_lng === 'string') {
        const parts = item.lat_lng.split(',');
        if (parts.length === 2) {
          latitude = parseFloat(parts[0].trim());
          longitude = parseFloat(parts[1].trim());
        }
      }

      // 3. Clean address: replace \r\n with ", "
      let address = item.address || "";
      address = address.replace(/\r\n/g, ", ");

      // 4. Simplify/rename nested needs columns: needs.needs -> needs, needs.excess -> excess
      let rawNeeds = "";
      let rawExcess = "";
      if (item.needs) {
        rawNeeds = item.needs.needs || "";
        rawExcess = item.needs.excess || "";
      }

      // 5. Clean needs and excess (replace \n with ", ", fill missing with "", replace "Unknown" with "")
      const cleanFieldText = (text) => {
        if (!text) return "";
        let cleaned = text.replace(/\n/g, ", ");
        if (cleaned === "Unknown") {
          return "";
        }
        return cleaned;
      };

      return {
        id,
        name,
        address,
        postcode,
        latitude,
        longitude,
        needs: cleanFieldText(rawNeeds),
        excess: cleanFieldText(rawExcess)
      };
    });

    // Save cleaned data to foodbankdata.json (using 4-space indent to match Python's to_json indent=4)
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(cleanedData, null, 4), 'utf8');
    console.log(`Successfully saved cleaned data to: ${OUTPUT_FILE}`);

  } catch (error) {
    console.error("Error occurred while updating data:", error);
    process.exit(1);
  }
}

// Run the script
updateJson();