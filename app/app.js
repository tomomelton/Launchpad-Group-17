

const express = require('express');
const app = express()
const { bestFoodBankFinder } = require('./bestFoodBankFinder')
const port = 3030;

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

app.listen(port, () => {
    console.log("running on port " + port);
});