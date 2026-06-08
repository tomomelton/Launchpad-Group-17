/**
 * ###############################################################################
 * 
 * File        : search.js
 * 
 * Date        : Friday 5th June 2026
 * 
 * Author      : Tom Melton
 * 
 * Description : Script to execute the search actions to find the best foodbank
 *               and store the result into local memory
 *  
 * History     : 05/06/2026 - v1.0
 * 
 * ###############################################################################
 */

const button = document.getElementById("search-button");
const addressField = document.getElementById("address-field");

function saveAddressHistory(address) {
    var history = JSON.parse(localStorage.getItem('addressHistory') || '[]');
    history = history.filter(function(a) { return a !== address; });
    history.unshift(address);
    if (history.length > 5) history.pop();
    localStorage.setItem('addressHistory', JSON.stringify(history));
}

function showAddressHistory() {
    var history = JSON.parse(localStorage.getItem('addressHistory') || '[]');
    var dropdown = document.getElementById('address-history');
    if (!dropdown) return;
    if (history.length === 0) {
        dropdown.style.display = 'none';
        return;
    }
    dropdown.innerHTML = '';
    history.forEach(function(addr) {
        var div = document.createElement('div');
        div.textContent = addr;
        div.style.cssText = 'padding:0.4rem 0.8rem;cursor:pointer;font-size:0.9rem;color:var(--ink-mid);border-bottom:1px solid var(--border);';
        div.addEventListener('click', function() {
            addressField.value = addr;
            dropdown.style.display = 'none';
        });
        dropdown.appendChild(div);
    });
    dropdown.style.display = 'block';
}

button.addEventListener("click", async () => {

    const address = addressField.value.trim();

    if (!address) {
        alert("Please enter an address or postcode.");
        return;
    }

    button.disabled = true;
    button.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

    try {
        const coords = await getCoordinates(address);
        const preferences = window.getSelectedPreferences ? [] : window.getSelectedPreferences;

        const response = await fetch("/api/best-foodbanks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                lat: coords.lat,
                lng: coords.lng,
                preferences
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Server error: ${response.status}`);
        }

        const data = await response.json();

        if (!data) {
            throw new Error("No food bank found for this location.");
        }

        localStorage.setItem("selectedFoodbank", JSON.stringify(data));
        localStorage.setItem("searchAddress", address);
        saveAddressHistory(address);
        window.location.href = "foodbanks.html";
    }
    catch (err) {
        console.error(err);
        alert(err.message || "Something went wrong. Please try again.");
    }
    finally {
        button.disabled = false;
        button.innerHTML = '<i class="fa-solid fa-magnifying-glass"></i>';
    }
});

addressField.addEventListener('focus', showAddressHistory);


// Created by ChatGPT (04/06/26 20:00)
async function getCoordinates(address) {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`;

    const response = await fetch(url);
    const data = await response.json();

    if (!data.length) {
        throw new Error("No results found for that address. Please try a different postcode or address.");
    }

    return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
    };
}

window.getCoords = getCoordinates