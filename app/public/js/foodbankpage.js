/**
 * ###############################################################################
 * 
 * File        : foodbankpage.js
 * 
 * Date        : Thursday 4th June 2026
 * 
 * Author      : Tom Melton
 * 
 * Description : Script to dynamically fill the foodbank page with the
*                information of the selected foodbank
 *  
 * History     : 03/06/2026 - v1.0
 * 
 * ###############################################################################
 */


const button = document.getElementById("search-button");

button.addEventListener("click", async () => {

    const address = document.getElementById("address-field").value
    try {
        const coords = await getCoordinates(address)
    
        // Call your server endpoint
        const response = await fetch('/api/find-best-foodbank', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_lat: coords.lat,
                user_lon: coords.lng,
                preferences: [] // Add user preferences here if needed
            })
        });
        
        const bestFoodBank = await response.json();
        console.log(bestFoodBank);


    // window.location.href="foodbanks.html"
    }
    catch (err) {
        console.error(err.message)
    }

    
})

// Created by ChatGPT (04/06/26 20:00)
async function getCoordinates(address) {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`;

    const response = await fetch(url);
    const data = await response.json();

    if (!data.length) {
        throw new Error("No results found");
    }

    return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
    };
}