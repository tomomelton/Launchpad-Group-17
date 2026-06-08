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

document.addEventListener("DOMContentLoaded", () => {

    const data = JSON.parse(localStorage.getItem("selectedFoodbank"));

    if (data) {

        // Normalise needs/excess to arrays (backend may send strings or arrays)
        const toArray = (val) => {
            if (Array.isArray(val)) return val;
            if (typeof val === 'string' && val.trim()) return val.split(', ');
            return [];
        };
        data.excess = toArray(data.excess);
        data.needs = toArray(data.needs);

        //####### Load Main Foodbank Details #######
        document.getElementById("fb-header").textContent =
            data.name;

        const addressParts = data.address.split(", ")
        document.getElementById("fb-address").innerHTML =
            "<b>Address: </b>" + addressParts[0] + ", " + addressParts[1];

        document.getElementById("fb-postcode").innerHTML =
            "<b>Postcode: </b>" + data.postcode;

        //####### Clear Placeholder Elements #######
        document.querySelectorAll(".list-placeholder").forEach(element => {
            element.remove();
        });

        //####### Load Foodbank Excess #######
        const excessList = document.getElementById("excess-list")

        if (data.excess.length === 0) {
            let li = document.createElement("li");
            let p = document.createElement("p");
            p.textContent = "No items currently in excess";
            li.appendChild(p);
            excessList.appendChild(li);
        } else {
            data.excess.forEach(item => {
                let p = document.createElement("p");
                p.textContent = item;

                let li = document.createElement("li");
                li.appendChild(p);

                excessList.appendChild(li);
            });
        }

        //####### Load Foodbank Needs #######
        const needsList = document.getElementById("needs-list")

        if (data.needs.length === 0) {
            let li = document.createElement("li");
            let p = document.createElement("p");
            p.textContent = "No items currently needed";
            li.appendChild(p);
            needsList.appendChild(li);
        } else {
            data.needs.forEach(item => {
                let p = document.createElement("p");
                p.textContent = item;

                let li = document.createElement("li");
                li.appendChild(p);

                needsList.appendChild(li);
            });
        }

        //####### Load Map #######
        const map = L.map('fb-map', {
        center: [
            data.latitude,
            data.longitude
        ],
        zoom: 12
        }); 

        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        L.marker([
            data.latitude,
            data.longitude
        ]).addTo(map)
            .bindPopup(
                `${data.name}
                <p id="adrs">${data.address}</p>
                <style>#adrs{font-size: x-small}</style>`
            )
            .openPopup();
        
        
}

})