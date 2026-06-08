/**
 * Address search, geocoding, recent foodbank cards, and homepage search flow.
 */
const button = document.getElementById("search-button");
const addressField = document.getElementById("address-field");
const addressSuggestions = document.getElementById("address-suggestions");
const recentFoodbankList = document.getElementById("recent-foodbank-list");

function translate(key) {
    return window.I18N && window.I18N.t ? window.I18N.t(key) : key;
}

function toArray(value) {
    if (Array.isArray(value)) return value;
    if (typeof value === "string" && value.trim()) return value.split(", ");
    return [];
}

function formatDistance(distanceMetres) {
    if (!Number.isFinite(Number(distanceMetres))) return translate("recent_distance_unavailable");
    return (Number(distanceMetres) / 1000).toFixed(2) + " km away";
}

function compactResolvedPlace(displayName, fallback) {
    const raw = String(displayName || fallback || "").trim();
    if (!raw) return "Unknown location";

    const parts = raw.split(",").map(part => part.trim()).filter(Boolean);
    const postcodePattern = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i;
    const genericParts = new Set(["norfolk", "england", "united kingdom", "uk"]);

    const usefulParts = parts.filter(part => {
        const lower = part.toLowerCase();
        return !postcodePattern.test(part) && !genericParts.has(lower);
    });

    if (usefulParts.length === 0) return parts[0] || raw;
    if (usefulParts[0].length <= 3 && usefulParts[1]) return usefulParts[1];
    return usefulParts.slice(0, 2).join(", ");
}

function saveRecentFoodbank(foodbank, searchLocation) {
    if (!foodbank || !searchLocation) return;

    const recent = JSON.parse(localStorage.getItem("recentFoodbanks") || "[]");
    const entry = {
        id: foodbank.id || foodbank.name,
        bank: foodbank,
        input: searchLocation.input,
        resolvedAddress: searchLocation.resolvedAddress,
        resolvedLabel: compactResolvedPlace(searchLocation.resolvedAddress, searchLocation.input),
        lat: searchLocation.lat,
        lng: searchLocation.lng,
        savedAt: Date.now()
    };

    const deduped = recent.filter(item => item.id !== entry.id && item.input !== entry.input);
    deduped.unshift(entry);
    localStorage.setItem("recentFoodbanks", JSON.stringify(deduped.slice(0, 2)));
}

function renderRecentFoodbanks() {
    if (!recentFoodbankList) return;

    const recent = JSON.parse(localStorage.getItem("recentFoodbanks") || "[]").slice(0, 2);
    recentFoodbankList.innerHTML = "";

    if (recent.length === 0) {
        const placeholder = document.createElement("article");
        placeholder.className = "recommendation-card recommendation-placeholder";
        const p = document.createElement("p");
        p.textContent = translate("recent_empty");
        placeholder.appendChild(p);
        recentFoodbankList.appendChild(placeholder);
        return;
    }

    recent.forEach(item => {
        const card = document.createElement("article");
        card.className = "recommendation-card recent-foodbank-card";

        const header = document.createElement("div");
        header.className = "recommendation-card-header";
        header.innerHTML = '<span class="recommendation-rank">' + translate("recent_label") + '</span><strong>' + (item.bank.name || "Foodbank") + '</strong>';

        const place = document.createElement("p");
        place.className = "recommendation-postcode";
        place.innerHTML = '<i class="fa-solid fa-location-dot" aria-hidden="true"></i> <span><b>' + translate("recent_place_label") + ':</b> ' + (item.resolvedLabel || compactResolvedPlace(item.resolvedAddress, item.input)) + '</span>';

        const postcode = document.createElement("p");
        postcode.className = "recommendation-postcode";
        postcode.innerHTML = '<i class="fa-solid fa-envelope" aria-hidden="true"></i> ' + (item.bank.postcode || "Postcode unavailable");

        const distance = document.createElement("p");
        distance.className = "recommendation-distance";
        distance.innerHTML = '<i class="fa-solid fa-route" aria-hidden="true"></i> ' + formatDistance(item.bank.distance);

        const button = document.createElement("button");
        button.type = "button";
        button.className = "btn btn-secondary btn-small recommendation-select";
        button.textContent = translate("recent_view");
        button.addEventListener("click", () => {
            localStorage.setItem("selectedFoodbank", JSON.stringify(item.bank));
            localStorage.setItem("searchAddress", item.input || item.resolvedLabel || "");
            localStorage.setItem("searchLocation", JSON.stringify({
                input: item.input,
                resolvedAddress: item.resolvedAddress,
                lat: item.lat,
                lng: item.lng
            }));
            window.location.href = "foodbanks.html";
        });

        card.appendChild(header);
        card.appendChild(place);
        card.appendChild(postcode);
        card.appendChild(distance);
        card.appendChild(button);
        recentFoodbankList.appendChild(card);
    });
}

let suggestionAbortController = null;
let suggestionTimer = null;

async function updateAddressSuggestions(query) {
    if (!addressSuggestions || !query || query.trim().length < 3) return;

    if (suggestionAbortController) suggestionAbortController.abort();
    suggestionAbortController = new AbortController();

    const url = "https://nominatim.openstreetmap.org/search?format=json&limit=5&addressdetails=1&countrycodes=gb&q=" + encodeURIComponent(query);
    const response = await fetch(url, { signal: suggestionAbortController.signal });
    const data = await response.json();

    addressSuggestions.innerHTML = "";
    data.forEach(result => {
        const option = document.createElement("option");
        option.value = compactResolvedPlace(result.display_name, query);
        option.label = result.display_name || option.value;
        option.dataset.lat = result.lat;
        option.dataset.lon = result.lon;
        option.dataset.displayName = result.display_name || option.value;
        addressSuggestions.appendChild(option);
    });
}

if (addressField) {
    addressField.addEventListener("input", () => {
        clearTimeout(suggestionTimer);
        suggestionTimer = setTimeout(() => {
            updateAddressSuggestions(addressField.value.trim()).catch(error => {
                if (error.name !== "AbortError") console.error("Could not load address suggestions:", error);
            });
        }, 350);
    });
}

if (button && addressField) {
    button.addEventListener("click", async () => {
        const address = addressField.value.trim();

        if (!address) {
            alert("Please enter an address or postcode.");
            return;
        }

        button.disabled = true;
        button.innerHTML = '<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i>';

        try {
            const coords = await getCoordinates(address);
            const preferences = window.getSelectedPreferences ? window.getSelectedPreferences() : [];

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

            const searchLocation = {
                input: address,
                resolvedAddress: coords.displayName,
                resolvedLabel: compactResolvedPlace(coords.displayName, address),
                lat: coords.lat,
                lng: coords.lng
            };

            localStorage.setItem("selectedFoodbank", JSON.stringify(data));
            localStorage.setItem("searchedFoodItems", JSON.stringify(preferences));
            localStorage.setItem("searchAddress", searchLocation.resolvedLabel);
            localStorage.setItem("searchLocation", JSON.stringify(searchLocation));
            saveRecentFoodbank(data, searchLocation);
            window.location.href = "foodbanks.html";
        }
        catch (err) {
            console.error(err);
            alert(err.message || "Something went wrong. Please try again.");
        }
        finally {
            button.disabled = false;
            button.innerHTML = '<i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>';
        }
    });
}

async function getCoordinates(address) {
    const matchingOption = addressSuggestions ? Array.from(addressSuggestions.options).find(option => option.value === address) : null;
    if (matchingOption && matchingOption.dataset.lat && matchingOption.dataset.lon) {
        return {
            lat: parseFloat(matchingOption.dataset.lat),
            lng: parseFloat(matchingOption.dataset.lon),
            displayName: matchingOption.dataset.displayName || matchingOption.label || address
        };
    }

    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&addressdetails=1&countrycodes=gb&q=${encodeURIComponent(address)}`;
    const response = await fetch(url);
    const data = await response.json();

    if (!data.length) {
        throw new Error("No results found for that address. Please try a different postcode or address.");
    }

    return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
        displayName: data[0].display_name || address
    };
}

window.getCoords = getCoordinates;
window.renderRecentFoodbanks = renderRecentFoodbanks;

document.addEventListener("DOMContentLoaded", renderRecentFoodbanks);
document.addEventListener("languagechange", renderRecentFoodbanks);
