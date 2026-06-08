/**
 * ###############################################################################
 * 
 * File        : main.js
 * 
 * Date        : Wednesday 3rd June 2026
 * 
 * Author      : Tom Melton
 * 
 * Description : Web app entry point that serves static files from 'public' folder
 *               and parses JSON requests.
 *  
 * History     : 01/06/2026 - v1.0
 * 
 * ###############################################################################
 */

const express = require('express');
const fs = require("fs");
const app = express()
const { bestFoodBankFinder } = require('./bestFoodBankFinder')
const port = 3000;

app.use(express.static('public'))
app.use(express.json());


// Find Best Foodbank API Endpoint
app.post("/api/best-foodbanks", async (req, res) => {
    try {
        let {lat, lng, preferences} = req.body;

        if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) {
            return res.status(400).json({ error: "Invalid coordinates provided" });
        }

        lat = Number(lat);
        lng = Number(lng);

        const finder = new bestFoodBankFinder();
        const result = await finder.findBest(lat, lng, preferences);

        if (!result) {
            return res.status(404).json({ error: "No food bank found" });
        }

        res.json(result);
    } catch (err) {
        console.error("Error in /api/best-foodbanks:", err);
        res.status(500).json({ error: "Failed to find best food bank. Please try again later." });
    }
});


// Get List of Foodbanks
app.get("/api/foodbank-data", (req, res) => {
    try {
        const data = JSON.parse(
            fs.readFileSync("backend/data/food-bank-data.json", "utf8")
        );
        res.json(data);
    } catch (err) {
        console.error("Error reading food bank data:", err);
        res.status(500).json({ error: "Failed to load food bank data" });
    }
});


// Global error handler — catches anything that slips through
app.use((err, req, res, next) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ error: "Internal server error" });
});

// Get food item categories for filter dropdown
app.get("/api/food-bank-items", (req, res) => {
    const data = JSON.parse(
        fs.readFileSync("backend/data/food-bank-items.json", "utf8")
    );
    res.json(data)
})


app.listen(port, () => {
    console.log("Running on port " + port);
});