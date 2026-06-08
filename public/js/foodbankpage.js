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

        const searchLocation = JSON.parse(localStorage.getItem("searchLocation") || "null");
        if (searchLocation && searchLocation.resolvedAddress) {
            const resolvedCard = document.getElementById("fb-resolved-location");
            const resolvedAddress = document.getElementById("fb-resolved-address");
            resolvedAddress.textContent = searchLocation.resolvedAddress;
            resolvedCard.hidden = false;
        }

        const addressParts = data.address.split(", ")
        document.getElementById("fb-address").textContent =
            addressParts[0] + ", " + addressParts[1];

        document.getElementById("fb-postcode").textContent = data.postcode;

        const distKm = data.distance ? (data.distance / 1000).toFixed(2) : "unknown";
        const walkMin = data.distance ? Math.round(data.distance / 1.34 / 60) : "unknown";
        document.getElementById("fb-distance").textContent = distKm + " km";
        document.getElementById("fb-time").textContent = walkMin + " min";

        const directionsOrigin = searchLocation ? searchLocation.lat + "," + searchLocation.lng : "";
        const directionsUrl = "https://www.google.com/maps/dir/?api=1" +
            (directionsOrigin ? "&origin=" + encodeURIComponent(directionsOrigin) : "") +
            "&destination=" + encodeURIComponent(data.latitude + "," + data.longitude) +
            "&travelmode=walking";
        const directionsLink = document.createElement("a");
        directionsLink.href = directionsUrl;
        directionsLink.target = "_blank";
        directionsLink.className = "btn";
        directionsLink.innerHTML = '<i class="fa-solid fa-location-arrow"></i> Get walking directions';
        document.getElementById("fb-actions").appendChild(directionsLink);

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
        const foodbankLatLng = [data.latitude, data.longitude];
        const searchLatLng = searchLocation ? [searchLocation.lat, searchLocation.lng] : null;
        const map = L.map('fb-map', {
        center: searchLatLng || foodbankLatLng,
        zoom: 12
        }); 

        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        const foodbankMarker = L.marker(foodbankLatLng).addTo(map)
            .bindPopup(
                `${data.name}
                <p id="adrs">${data.address}</p>
                <style>#adrs{font-size: x-small}</style>`
            );

        if (searchLatLng) {
            const searchIcon = L.divIcon({
                className: 'user-location-marker',
                html: '<div style="background:#2f80ed;border:3px solid white;border-radius:50%;width:18px;height:18px;box-shadow:0 0 0 2px #2f80ed;"></div>',
                iconSize: [18, 18],
                iconAnchor: [9, 9]
            });

            const searchMarker = L.marker(searchLatLng, { icon: searchIcon }).addTo(map)
                .bindPopup(
                    `<b>Your resolved location</b><p id="resolved-adrs">${searchLocation.resolvedAddress}</p><style>#resolved-adrs{font-size:x-small}</style>`
                );

            const fallbackLine = L.polyline([searchLatLng, foodbankLatLng], {
                color: '#2f80ed',
                weight: 4,
                opacity: 0.75,
                dashArray: '8, 8'
            });

            const routeUrl = 'https://router.project-osrm.org/route/v1/foot/' +
                searchLocation.lng + ',' + searchLocation.lat + ';' +
                data.longitude + ',' + data.latitude +
                '?overview=full&geometries=geojson';

            fetch(routeUrl)
                .then(response => {
                    if (!response.ok) throw new Error('Route request failed');
                    return response.json();
                })
                .then(routeData => {
                    if (!routeData.routes || !routeData.routes[0] || !routeData.routes[0].geometry) {
                        throw new Error('No route geometry returned');
                    }

                    const routeLine = L.geoJSON(routeData.routes[0].geometry, {
                        style: {
                            color: '#2f80ed',
                            weight: 5,
                            opacity: 0.85
                        }
                    }).addTo(map);

                    map.fitBounds(L.featureGroup([searchMarker, foodbankMarker, routeLine]).getBounds(), {
                        padding: [30, 30]
                    });
                })
                .catch(error => {
                    console.error('Could not load walking route, showing straight-line fallback:', error);
                    fallbackLine.addTo(map);
                    map.fitBounds(L.featureGroup([searchMarker, foodbankMarker, fallbackLine]).getBounds(), {
                        padding: [30, 30]
                    });
                });
        } else {
            foodbankMarker.openPopup();
        }
        
        
}

})