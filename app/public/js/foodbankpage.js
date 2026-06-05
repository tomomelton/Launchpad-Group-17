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

        const preferences = [] // Add user preferences

        fetch("/api/best-foodbanks", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                lat: coords.lat,
                lng: coords.lng,
                preferences: preferences
            })
        })
        .then(res => res.json())
        .then(data => {

            document.getElementById("fb-address")
                        .textContent = "Address: " + data.address;
        });

    window.location.href="foodbanks.html"

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