/**
 * ###############################################################################
 * 
 * File        : loadMap.js
 * 
 * Date        : Saturday 6th June 2026
 * 
 * Author      : Tom Melton
 * 
 * Description : Script to create and load a map to index.html which contains
 *               markers for all the foodbanks in the Ladywood area
 *  
 * History     : 06/06/2026 - v1.0
 * 
 * ###############################################################################
 */


async function initMap() {
    const coords = await window.getCoords("Ladywood, Birmingham");

    const map = L.map('map', {
    center: [
        coords.lat,
        coords.lng
    ],
    zoom: 11
    }); 


    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);


    fetch("/api/foodbank-data")
        .then((response) => response.json())
        .then((responseData) => {
            for (fb of responseData) {
                L.marker([
                    fb.latitude,
                    fb.longitude
                ]).addTo(map)
                    .bindPopup(fb.name)
                }
        })
}

initMap();