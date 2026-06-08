

const express = require('express');
const fs = require("fs");
const app = express()
const { bestFoodBankFinder } = require('./bestFoodBankFinder')
const port = 3000;

app.use(express.static('public'))
app.use(express.json());


// Find Best Foodbank API Endpoint
app.post("/api/best-foodbanks", async (req, res) => {

    let {lat, lng, preferences} = req.body;

    lat = Number(lat);
    lng = Number(lng);

    const finder = new bestFoodBankFinder();
    const result = await finder.findBest(lat, lng, preferences);
    res.json(result);
});


// Get List of Foodbanks
app.get("/api/foodbank-data", (req, res) => {
    const data = JSON.parse(
        fs.readFileSync("backend/data/food-bank-data.json", "utf8")
    );
    res.json(data)
})


app.listen(port, () => {
    console.log("Running on port " + port);
});