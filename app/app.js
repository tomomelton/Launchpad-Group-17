

const express = require('express');
const app = express()
const bestFoodBankFinder = require('./bestFoodBankFinder')
const port = 3030;

app.use(express.static('public'))
app.use(express.json());

// Find Best Foodbank API Endpoint
app.post('/api/find-best-foodbank', (req, res) => {
  try {
    const { user_lat, user_lon, preferences } = req.body;
    const finder = new bestFoodBankFinder();
    const result = finder.findBest(user_lat, user_lon, preferences);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => {
    console.log("running on port " + port);
});