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

        const normaliseText = (value) => String(value || "")
            .toLowerCase()
            .replace(/&/g, "and")
            .replace(/[^a-z0-9]+/g, " ")
            .trim();

        const itemMatchesQuery = (item, query) => {
            const itemText = normaliseText(item);
            const queryText = normaliseText(query);
            return Boolean(itemText && queryText && (itemText === queryText || itemText.includes(queryText) || queryText.includes(itemText)));
        };

        const getMatchingQueries = (items, queriedItems) => queriedItems.filter(query =>
            items.some(item => itemMatchesQuery(item, query))
        );

        const getMatchingItems = (items, queriedItems) => items.filter(item =>
            queriedItems.some(query => itemMatchesQuery(item, query))
        );

        const formatDistance = (distanceMetres) => {
            if (!Number.isFinite(distanceMetres)) return "Distance unknown";
            return (distanceMetres / 1000).toFixed(2) + " km away";
        };

        const haversineDistance = (lat1, lon1, lat2, lon2) => {
            const toRad = degrees => degrees * Math.PI / 180;
            const earthRadius = 6371000;
            const dLat = toRad(Number(lat2) - Number(lat1));
            const dLon = toRad(Number(lon2) - Number(lon1));
            const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(toRad(Number(lat1))) * Math.cos(toRad(Number(lat2))) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
            return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        };

        data.excess = toArray(data.excess);
        data.needs = toArray(data.needs);

        const queriedItems = toArray(JSON.parse(localStorage.getItem("searchedFoodItems") || "[]"));

        //####### Load Main Foodbank Details #######
        document.getElementById("fb-header").textContent =
            data.name;

        const searchLocation = JSON.parse(localStorage.getItem("searchLocation") || "null");

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

        const renderItemGrid = (items, listElement, emptyMessage, highlightType) => {
            listElement.innerHTML = "";

            if (items.length === 0) {
                const li = document.createElement("li");
                li.className = "item-card item-card-empty";
                li.dataset.item = emptyMessage.toLowerCase();

                const p = document.createElement("p");
                p.textContent = emptyMessage;
                li.appendChild(p);
                listElement.appendChild(li);
                return;
            }

            items.forEach(item => {
                const matchingQueries = queriedItems.filter(query => itemMatchesQuery(item, query));
                const li = document.createElement("li");
                li.className = "item-card";
                li.dataset.item = item.toLowerCase();

                if (matchingQueries.length > 0) {
                    li.classList.add(highlightType === "excess" ? "item-card-match-excess" : "item-card-match-needs");
                    li.setAttribute("title", "Matches your search: " + matchingQueries.join(", "));
                }

                const icon = document.createElement("span");
                icon.className = "item-card-icon";
                icon.innerHTML = '<i class="fa-solid fa-box-open"></i>';

                const p = document.createElement("p");
                p.textContent = item;

                li.appendChild(icon);
                li.appendChild(p);

                if (matchingQueries.length > 0) {
                    const badge = document.createElement("span");
                    badge.className = "item-match-badge";
                    badge.textContent = highlightType === "excess" ? "Requested" : "Needed";
                    li.appendChild(badge);
                }

                listElement.appendChild(li);
            });
        };

        const attachItemFilter = (inputElement, listElements) => {
            inputElement.addEventListener("input", () => {
                const query = inputElement.value.trim().toLowerCase();
                listElements.forEach(listElement => {
                    listElement.querySelectorAll(".item-card").forEach(card => {
                        card.hidden = query && !card.dataset.item.includes(query);
                    });
                });
            });
        };

        const renderRecommendationCard = (recommendation) => {
            const card = document.createElement("article");
            card.className = "recommendation-card";

            const hasQueriedItems = queriedItems.length > 0;
            const matchedText = recommendation.excessMatches.join(", ");
            const neededText = recommendation.needsMatches.join(", ");
            const matchPills = hasQueriedItems ? `
                <div class="recommendation-reason">
                    ${recommendation.excessMatches.length > 0 ? `<span class="recommendation-pill recommendation-pill-good"><i class="fa-solid fa-circle-check"></i> ${matchedText}</span>` : ""}
                    ${recommendation.needsMatches.length > 0 ? `<span class="recommendation-pill recommendation-pill-warning"><i class="fa-solid fa-triangle-exclamation"></i> Also needs: ${neededText}</span>` : ""}
                </div>
            ` : "";

            card.innerHTML = `
                <div class="recommendation-card-header">
                    <span class="recommendation-rank">Alternative</span>
                    <strong>${recommendation.bank.name}</strong>
                </div>
                <p class="recommendation-postcode"><i class="fa-solid fa-envelope"></i> ${recommendation.bank.postcode || "Postcode unavailable"}</p>
                <p class="recommendation-distance"><i class="fa-solid fa-route"></i> ${formatDistance(recommendation.distance)}</p>
                ${matchPills}
                <p>${recommendation.reason}</p>
                <button type="button" class="btn btn-secondary btn-small recommendation-select">View this foodbank</button>
            `;

            card.querySelector(".recommendation-select").addEventListener("click", () => {
                localStorage.setItem("selectedFoodbank", JSON.stringify({
                    ...recommendation.bank,
                    distance: recommendation.distance
                }));
                window.location.href = "foodbanks.html";
            });

            return card;
        };

        const renderRecommendations = async () => {
            const recommendationList = document.getElementById("recommendation-list");
            if (!recommendationList || !searchLocation) return;

            try {
                const response = await fetch("/api/foodbank-data");
                if (!response.ok) throw new Error("Could not load foodbank data");

                const foodbanks = await response.json();
                const recommendations = foodbanks
                    .filter(bank => bank.id !== data.id && bank.name !== data.name)
                    .map(bank => {
                        const normalisedBank = {
                            ...bank,
                            latitude: Number(bank.latitude),
                            longitude: Number(bank.longitude),
                            excess: toArray(bank.excess),
                            needs: toArray(bank.needs)
                        };
                        const distance = haversineDistance(searchLocation.lat, searchLocation.lng, normalisedBank.latitude, normalisedBank.longitude) * 1.3;
                        const excessMatches = getMatchingQueries(normalisedBank.excess, queriedItems);
                        const needsMatches = getMatchingQueries(normalisedBank.needs, queriedItems);
                        const score = (excessMatches.length * 10000) - (needsMatches.length * 2500) - distance;
                        const reason = queriedItems.length === 0
                            ? "Another foodbank close to you."
                            : excessMatches.length > 0
                                ? `Recommended because it has ${excessMatches.length} of your requested item${excessMatches.length === 1 ? "" : "s"} in excess, while still considering walking distance.`
                                : "Recommended as a nearby alternative.";

                        return { bank: normalisedBank, distance, excessMatches, needsMatches, score, reason };
                    })
                    .sort((a, b) => b.score - a.score)
                    .slice(0, 2);

                recommendationList.innerHTML = "";

                if (recommendations.length === 0) {
                    recommendationList.innerHTML = '<article class="recommendation-card"><p>No alternative foodbanks available.</p></article>';
                    return;
                }

                recommendations.forEach(recommendation => {
                    recommendationList.appendChild(renderRecommendationCard(recommendation));
                });
            } catch (error) {
                console.error("Could not render recommendations:", error);
                recommendationList.innerHTML = '<article class="recommendation-card"><p>Recommendations are unavailable right now.</p></article>';
            }
        };

        //####### Load Foodbank Excess #######
        const excessList = document.getElementById("excess-list");
        renderItemGrid(data.excess, excessList, "No items currently in excess", "excess");

        //####### Load Foodbank Needs #######
        const needsList = document.getElementById("needs-list");
        renderItemGrid(data.needs, needsList, "No items currently needed", "needs");

        attachItemFilter(document.getElementById("item-filter"), [excessList, needsList]);
        renderRecommendations();

        //####### Load Map #######
        const foodbankLatLng = [data.latitude, data.longitude];
        const searchLatLng = searchLocation ? [searchLocation.lat, searchLocation.lng] : null;
        const map = L.map('fb-map', {
        center: searchLatLng || foodbankLatLng,
        zoom: 12
        });

        setTimeout(() => map.invalidateSize(), 100);

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
                    setTimeout(() => map.invalidateSize(), 100);
                })
                .catch(error => {
                    console.error('Could not load walking route, showing straight-line fallback:', error);
                    fallbackLine.addTo(map);
                    map.fitBounds(L.featureGroup([searchMarker, foodbankMarker, fallbackLine]).getBounds(), {
                        padding: [30, 30]
                    });
                    setTimeout(() => map.invalidateSize(), 100);
                });
        } else {
            foodbankMarker.openPopup();
            setTimeout(() => map.invalidateSize(), 100);
        }
    }
});
