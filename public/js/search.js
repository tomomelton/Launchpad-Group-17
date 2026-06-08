/**
 * Address search, visible address suggestions, recent location cards, and homepage search flow.
 */
const button = document.getElementById("search-button");
const addressField = document.getElementById("address-field");
const addressSuggestionList = document.getElementById("address-suggestion-list");
const recentFoodbankList = document.getElementById("recent-foodbank-list");

let suggestionAbortController = null;
let suggestionTimer = null;
let selectedAddressSuggestion = null;
let latestAddressSuggestions = [];

function translate(key) {
    return window.I18N && window.I18N.t ? window.I18N.t(key) : key;
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

function normaliseRecentEntry(item) {
    const bank = item.bank || item.foodbank || {};
    const input = item.input || item.searchInput || item.address || "";
    const resolvedAddress = item.resolvedAddress || item.displayName || input;
    const resolvedLabel = item.resolvedLabel || compactResolvedPlace(resolvedAddress, input);

    return {
        id: item.id || [resolvedLabel, input].filter(Boolean).join("|") || String(item.savedAt || Date.now()),
        bank,
        input,
        resolvedAddress,
        resolvedLabel,
        lat: item.lat,
        lng: item.lng,
        savedAt: item.savedAt || Date.now()
    };
}

function getStoredRecentFoodbanks() {
    try {
        const parsed = JSON.parse(localStorage.getItem("recentFoodbanks") || "[]");
        return Array.isArray(parsed) ? parsed : [];
    }
    catch (error) {
        console.warn("Could not read recent searches:", error);
        return [];
    }
}

function saveRecentFoodbank(foodbank, searchLocation) {
    if (!searchLocation) return;

    const recent = getStoredRecentFoodbanks();

    const entry = normaliseRecentEntry({
        id: searchLocation.resolvedLabel || searchLocation.input,
        bank: foodbank || {},
        input: searchLocation.input,
        resolvedAddress: searchLocation.resolvedAddress,
        resolvedLabel: compactResolvedPlace(searchLocation.resolvedAddress, searchLocation.input),
        lat: searchLocation.lat,
        lng: searchLocation.lng,
        savedAt: Date.now()
    });

    const entryKey = (entry.resolvedLabel || entry.input || "").toLowerCase();
    const deduped = recent
        .map(normaliseRecentEntry)
        .filter(item => (item.resolvedLabel || item.input || "").toLowerCase() !== entryKey);

    deduped.unshift(entry);
    localStorage.setItem("recentFoodbanks", JSON.stringify(deduped.slice(0, 2)));
}

function renderRecentFoodbanks() {
    if (!recentFoodbankList) return;

    const recent = getStoredRecentFoodbanks()
        .map(normaliseRecentEntry)
        .slice(0, 2);

    recentFoodbankList.innerHTML = "";

    if (recent.length === 0) {
        const placeholder = document.createElement("article");
        placeholder.className = "recent-search-card recent-search-placeholder";

        const icon = document.createElement("span");
        icon.className = "recent-search-icon";
        icon.innerHTML = '<i class="fa-solid fa-location-dot" aria-hidden="true"></i>';

        const p = document.createElement("p");
        p.textContent = translate("recent_empty");

        placeholder.appendChild(icon);
        placeholder.appendChild(p);
        recentFoodbankList.appendChild(placeholder);
        return;
    }

    recent.forEach(item => {
        const card = document.createElement("article");
        card.className = "recent-search-card";

        const top = document.createElement("div");
        top.className = "recent-search-top";

        const icon = document.createElement("span");
        icon.className = "recent-search-icon";
        icon.innerHTML = '<i class="fa-solid fa-location-dot" aria-hidden="true"></i>';

        const text = document.createElement("div");
        const label = document.createElement("span");
        label.className = "recent-search-eyebrow";
        label.textContent = translate("recent_location_label");

        const title = document.createElement("h3");
        title.textContent = item.resolvedLabel || item.input || translate("recent_unknown_location");

        text.appendChild(label);
        text.appendChild(title);
        top.appendChild(icon);
        top.appendChild(text);

        const original = document.createElement("p");
        original.className = "recent-search-meta";
        original.innerHTML = '<i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>';
        const originalText = document.createElement("span");
        originalText.textContent = " " + translate("recent_original_search") + ": " + (item.input || item.resolvedLabel || translate("recent_unknown_location"));
        original.appendChild(originalText);

        const match = document.createElement("p");
        match.className = "recent-search-meta";
        match.innerHTML = '<i class="fa-solid fa-hand-holding-heart" aria-hidden="true"></i>';
        const matchText = document.createElement("span");
        matchText.textContent = " " + translate("recent_matched_foodbank") + ": " + (item.bank.name || translate("recent_foodbank_unavailable"));
        match.appendChild(matchText);

        const distance = document.createElement("p");
        distance.className = "recent-search-meta";
        distance.innerHTML = '<i class="fa-solid fa-route" aria-hidden="true"></i>';
        const distanceText = document.createElement("span");
        distanceText.textContent = " " + formatDistance(item.bank.distance);
        distance.appendChild(distanceText);

        const actions = document.createElement("div");
        actions.className = "recent-search-actions";

        const reuseButton = document.createElement("button");
        reuseButton.type = "button";
        reuseButton.className = "btn btn-secondary btn-small";
        reuseButton.textContent = translate("recent_use_search");
        reuseButton.addEventListener("click", () => {
            if (addressField) {
                addressField.value = item.resolvedLabel || item.input || "";
                addressField.focus();
            }
        });

        const openButton = document.createElement("button");
        openButton.type = "button";
        openButton.className = "btn btn-small";
        openButton.textContent = translate("recent_view");
        openButton.addEventListener("click", () => {
            localStorage.setItem("selectedFoodbank", JSON.stringify(item.bank));
            localStorage.setItem("searchAddress", item.resolvedLabel || item.input || "");
            localStorage.setItem("searchLocation", JSON.stringify({
                input: item.input,
                resolvedAddress: item.resolvedAddress,
                resolvedLabel: item.resolvedLabel,
                lat: item.lat,
                lng: item.lng
            }));
            window.location.href = "foodbanks.html";
        });

        actions.appendChild(reuseButton);
        if (item.bank && item.bank.name) actions.appendChild(openButton);

        card.appendChild(top);
        card.appendChild(original);
        card.appendChild(match);
        card.appendChild(distance);
        card.appendChild(actions);
        recentFoodbankList.appendChild(card);
    });
}

function hideAddressSuggestions() {
    if (!addressSuggestionList) return;
    addressSuggestionList.hidden = true;
    addressSuggestionList.innerHTML = "";
    if (addressField) addressField.setAttribute("aria-expanded", "false");
}

function chooseAddressSuggestion(suggestion) {
    selectedAddressSuggestion = suggestion;
    if (addressField) {
        addressField.value = suggestion.label;
        addressField.focus();
    }
    hideAddressSuggestions();
}

function renderAddressSuggestions(suggestions) {
    if (!addressSuggestionList || !addressField) return;

    addressSuggestionList.innerHTML = "";
    latestAddressSuggestions = suggestions;

    if (!suggestions.length) {
        hideAddressSuggestions();
        return;
    }

    suggestions.forEach((suggestion, index) => {
        const option = document.createElement("button");
        option.type = "button";
        option.className = "address-suggestion-option";
        option.setAttribute("role", "option");
        option.id = "address-suggestion-" + index;

        const title = document.createElement("span");
        title.className = "address-suggestion-title";
        title.textContent = suggestion.label;

        const detail = document.createElement("span");
        detail.className = "address-suggestion-detail";
        detail.textContent = suggestion.displayName;

        option.appendChild(title);
        option.appendChild(detail);
        option.addEventListener("click", () => chooseAddressSuggestion(suggestion));
        addressSuggestionList.appendChild(option);
    });

    addressSuggestionList.hidden = false;
    addressField.setAttribute("aria-expanded", "true");
}

async function updateAddressSuggestions(query) {
    const trimmed = String(query || "").trim();
    selectedAddressSuggestion = null;

    if (!trimmed || trimmed.length < 3) {
        hideAddressSuggestions();
        return;
    }

    if (suggestionAbortController) suggestionAbortController.abort();
    suggestionAbortController = new AbortController();

    const url = "https://nominatim.openstreetmap.org/search?format=json&limit=5&addressdetails=1&countrycodes=gb&q=" + encodeURIComponent(trimmed);
    const response = await fetch(url, { signal: suggestionAbortController.signal });
    const data = await response.json();

    const suggestions = data.map(result => ({
        label: compactResolvedPlace(result.display_name, trimmed),
        displayName: result.display_name || trimmed,
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon)
    })).filter(suggestion => Number.isFinite(suggestion.lat) && Number.isFinite(suggestion.lng));

    renderAddressSuggestions(suggestions);
}

if (addressField) {
    addressField.addEventListener("input", () => {
        selectedAddressSuggestion = null;
        clearTimeout(suggestionTimer);
        suggestionTimer = setTimeout(() => {
            updateAddressSuggestions(addressField.value.trim()).catch(error => {
                if (error.name !== "AbortError") {
                    console.error("Could not load address suggestions:", error);
                    hideAddressSuggestions();
                }
            });
        }, 300);
    });

    addressField.addEventListener("keydown", event => {
        if (event.key === "Escape") hideAddressSuggestions();
        if (event.key === "ArrowDown" && !addressSuggestionList?.hidden) {
            event.preventDefault();
            addressSuggestionList.querySelector("button")?.focus();
        }
    });
}

if (addressSuggestionList) {
    addressSuggestionList.addEventListener("keydown", event => {
        const options = Array.from(addressSuggestionList.querySelectorAll("button"));
        const currentIndex = options.indexOf(document.activeElement);

        if (event.key === "Escape") {
            hideAddressSuggestions();
            addressField?.focus();
        }

        if (event.key === "ArrowDown") {
            event.preventDefault();
            options[Math.min(currentIndex + 1, options.length - 1)]?.focus();
        }

        if (event.key === "ArrowUp") {
            event.preventDefault();
            if (currentIndex <= 0) addressField?.focus();
            else options[currentIndex - 1]?.focus();
        }
    });
}

document.addEventListener("click", event => {
    if (!event.target.closest(".address-search-wrap")) hideAddressSuggestions();
});

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
    const selectedMatchesInput = selectedAddressSuggestion && selectedAddressSuggestion.label === address;
    if (selectedMatchesInput) {
        return {
            lat: selectedAddressSuggestion.lat,
            lng: selectedAddressSuggestion.lng,
            displayName: selectedAddressSuggestion.displayName || address
        };
    }

    const matchingSuggestion = latestAddressSuggestions.find(suggestion => suggestion.label === address || suggestion.displayName === address);
    if (matchingSuggestion) {
        return {
            lat: matchingSuggestion.lat,
            lng: matchingSuggestion.lng,
            displayName: matchingSuggestion.displayName || address
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
window.renderRecentSearches = renderRecentFoodbanks;
window.updateAddressSuggestions = updateAddressSuggestions;

document.addEventListener("DOMContentLoaded", renderRecentFoodbanks);
document.addEventListener("languagechange", renderRecentFoodbanks);
