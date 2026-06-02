const express = require('express');
const cors = require('cors');
const path = require('path');

/**
 * ###############################################################################
 * 
 * File        : app.js
 * 
 * Date        : Tuesday 2nd June 2026
 * 
 * Description : Main Express server that serves the Food Bank Finder static pages
 *               and provides an in-memory cached /api/foodbanks endpoint.
 *               Data is fetched and cleaned from the Give Food API on startup and
 *               refreshed automatically in the background.
 * 
 * ###############################################################################
 */

const app = express();
const PORT = process.env.PORT || 3000;
const API_URL = "https://www.givefood.org.uk/api/2/foodbanks/search/?address=Ladywood,%20Birmingham";

// Enable Cross-Origin Resource Sharing (CORS)
app.use(cors());

// Serve static assets from root directories
app.use('/_assets', express.static(path.join(__dirname, '_assets')));
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/js', express.static(path.join(__dirname, 'js')));

// Serve leafet or node_modules files if needed (e.g. leaflet from node_modules)
app.use('/node_modules', express.static(path.join(__dirname, 'node_modules')));

// In-memory cache variables
let foodbankCache = [];
let isCacheLoaded = false;

/**
 * Fetches and cleans foodbank data from the external API,
 * then updates the in-memory cache.
 */
async function refreshFoodbankCache() {
  try {
    console.log("Updating in-memory food bank data cache from Give Food API...");
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const rawData = await response.json();
    console.log(`Successfully fetched ${rawData.length} records. Processing and cleaning...`);

    // Process and clean raw data
    const cleanedData = rawData.map(item => {
      // 1. Split latitude and longitude from lat_lng string e.g., "52.4818698,-1.91045"
      let latitude = null;
      let longitude = null;
      if (item.lat_lng && typeof item.lat_lng === 'string') {
        const parts = item.lat_lng.split(',');
        if (parts.length === 2) {
          latitude = parseFloat(parts[0].trim()) || null;
          longitude = parseFloat(parts[1].trim()) || null;
        }
      }

      // 2. Clean address: replace \r\n with ", "
      let address = item.address || "";
      address = address.replace(/\r\n/g, ", ").trim();

      // 3. Simplify/rename nested needs columns: needs.needs -> needs, needs.excess -> excess
      let rawNeeds = "";
      let rawExcess = "";
      if (item.needs) {
        rawNeeds = item.needs.needs || "";
        rawExcess = item.needs.excess || "";
      }

      // 4. Clean needs and excess (replace \n with ", ", fill missing with "", replace "Unknown" with "")
      const cleanFieldText = (text) => {
        if (!text) return "";
        let cleaned = text.replace(/\n/g, ", ");
        if (cleaned === "Unknown") {
          return "";
        }
        return cleaned.trim();
      };

      return {
        id: item.id,
        name: item.name || "",
        address,
        postcode: item.postcode || "",
        latitude,
        longitude,
        needs: cleanFieldText(rawNeeds),
        excess: cleanFieldText(rawExcess)
      };
    });

    // Update in-memory cache
    foodbankCache = cleanedData;
    isCacheLoaded = true;
    console.log("In-memory food bank cache successfully updated.");

  } catch (error) {
    console.error("Error occurred while refreshing cache:", error);
    // If the API call fails, we preserve the existing cache (if any) rather than wiping it
  }
}

// Route: GET / serves the homepage
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'templates', 'index.html'));
});

// Route: GET /api/foodbanks serves the cleaned data from in-memory cache
app.get('/api/foodbanks', (req, res) => {
  if (!isCacheLoaded) {
    return res.status(503).json({
      error: "Data cache is currently loading. Please try again in a few seconds."
    });
  }
  res.json(foodbankCache);
});

// Start Express web server
app.listen(PORT, async () => {
  console.log(`Server is running at http://localhost:${PORT}`);
  
  // Perform the initial fetch asynchronously on startup so it doesn't block boot
  await refreshFoodbankCache();

  // Set background interval to refresh the in-memory cache every 12 hours
  setInterval(refreshFoodbankCache, 12 * 60 * 60 * 1000);
});
