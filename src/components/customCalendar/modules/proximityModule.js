// proximityModule.js
import { API_BASE_URL } from '../../../config.js';

let userLocationCache = {};
let apiCallCount = 0;
let geocodeCallCount = 0;
let isUpdatingCalendarColors = false; // Flag to prevent redundant calls

// Added: Month-level cache
const monthCache = new Map(); // Key: "YYYY-MM", Value: { distanceCacheSnapshot }

export async function initProximityModule(calendarInstance, options, monthYearKey) {
    const { userAddress } = options;

    if (!calendarInstance || !userAddress) {
        console.warn("Proximity module: Missing required parameters.");
        return;
    }


    // Delegate geocoding and updates to updateCalendarColors
    await updateCalendarColors(calendarInstance, userAddress, monthYearKey);
}

async function getGeocode(address) {
    if (userLocationCache[address]) {
        return userLocationCache[address];
    }

    geocodeCallCount++;
    const url = `${API_BASE_URL}/api/geocode?address=${encodeURIComponent(address)}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Geocode request failed with status ${response.status}`);
        }
        const data = await response.json();
        if (!data.results || data.results.length === 0) {
            throw new Error(`Failed to fetch geocode: ${data.error || "Unknown error"}`);
        }
        const location = data.results[0].geometry.location;
        userLocationCache[address] = location; // Cache result
        return location;
    } catch (error) {
        console.error("Error fetching geocode data:", error.message);
        throw error;
    }
}

async function getDistances(userLocation, cities) {
    const origins = `${userLocation.lat},${userLocation.lng}`;
    const destinations = cities.map((city) => `${city.lat},${city.lng}`).join("|");
    const url = `${API_BASE_URL}/api/distance?origins=${origins}&destinations=${destinations}`;
    const response = await fetch(url);
    const data = await response.json();
    if (!data.rows || data.rows.length === 0) {
        throw new Error(`Failed to fetch distances: ${data.error || "Unknown error"}`);
    }
    return data.rows[0].elements.map((element, index) => ({
        city: cities[index].name,
        date: cities[index].date,
        distance: element.distance.value / 1000, // Convert meters to kilometers
    }));
}

const distanceCache = {}; // Cache for distances by city name

async function processCities(userLocation, cities) {

    // Group cities by name, keeping track of all dates
    const citiesByName = {};
    for (const city of cities) {
        if (!citiesByName[city.name]) {
            citiesByName[city.name] = { ...city, dates: [] };
        }
        citiesByName[city.name].dates.push(city.date);
    }

    // Deduplicate globally for geocoding
    const uniqueCities = Object.values(citiesByName);

    return uniqueCities;
}

function getCityFromUserAddress(fullAddress) {
    const parts = fullAddress.split(',');
    if (parts.length >= 2) {
        return parts[1].trim();
    }
    return fullAddress;
}

export async function updateCalendarColors(calendarInstance, userAddress, monthYearKey) {
    if (isUpdatingCalendarColors) {
        return;
    }

    if (monthCache.has(monthYearKey)) {
        const cachedData = monthCache.get(monthYearKey);
        applyCachedData(calendarInstance, cachedData);
        return;
    }

    isUpdatingCalendarColors = true;

    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Normalize to midnight for comparison

        const userLocation = await getGeocode(userAddress);

        const userCity = getCityFromUserAddress(userAddress);

        const scheduledCities = await calendarInstance.getScheduledCities();

        const cityArray = [];
        for (const [date, cityObj] of Object.entries(scheduledCities)) {
            const cellDate = new Date(date);
            if (cellDate < today) {
                continue; // Skip past dates
            }

            if (!cityObj.name || !Array.isArray(cityObj.name)) continue;

            cityObj.name.forEach((cityName) => {
                cityArray.push({
                    date,
                    name: cityName,
                    lat: cityObj.lat,
                    lng: cityObj.lng
                });
            });
        }

        const citiesToGeocode = await processCities(userLocation, cityArray);

        const uncachedCities = citiesToGeocode.filter(city => {
            const isCached = city.lat && city.lng && distanceCache[city.name];
            if (isCached) {
            }
            return !isCached;
        });

        if (uncachedCities.length > 0) {

            await Promise.all(
                uncachedCities.map(async city => {
                    if (!city.lat || !city.lng) {
                        try {
                            const geocodedCity = await getGeocode(`${city.name}, MT`);
                            city.lat = geocodedCity.lat;
                            city.lng = geocodedCity.lng;

                            distanceCache[city.name] = {
                                lat: geocodedCity.lat,
                                lng: geocodedCity.lng
                            };
                        } catch (error) {
                            console.error(`Failed to geocode city: ${city.name}`, error);
                        }
                    }
                })
            );

            const distances = await getDistances(userLocation, uncachedCities);

            distances.forEach(result => {
                distanceCache[result.city] = {
                    distance: result.distance,
                    date: result.date
                };
            });
        } else {
            console.log("No new cities to process. Using cached data.");
        }

        const currentMonthData = [];

        for (const city of citiesToGeocode) {
            const result = distanceCache[city.name];
            if (!result) continue;

            for (const date of city.dates) {
                const cell = calendarInstance.getCellByDate(date);
                if (!cell) continue;

                let tooltipDiv = cell.querySelector(".cell-tooltip-popup");

                if (result.distance <= 25) {
                    cell.classList.add("proximity-green");
                  
                    if (!tooltipDiv) {
                      tooltipDiv = document.createElement("div");
                      tooltipDiv.classList.add("cell-tooltip-popup");
                      cell.appendChild(tooltipDiv);
                    }
                    const tooltipText = `We are in ${city.name} on this date. Book now for no call fees!`;
                    tooltipDiv.textContent = tooltipText;
                    cell.setAttribute("data-tooltip-text", tooltipText);
                    console.log("[updateCalendarColors] Tooltip text set for cell:", cell, "Text:", tooltipText);
                  } else if (result.distance > 100) {
                    cell.classList.add("proximity-red");
                  
                    if (!tooltipDiv) {
                      tooltipDiv = document.createElement("div");
                      tooltipDiv.classList.add("cell-tooltip-popup");
                      cell.appendChild(tooltipDiv);
                    }
                    const tooltipText = `Lux Farrier Service is out of ${userCity} on this date. For emergencies, please call (707) 740-3925`;
                    tooltipDiv.textContent = tooltipText;
                    cell.setAttribute("data-tooltip-text", tooltipText);
                    console.log("[updateCalendarColors] Tooltip text set for cell:", cell, "Text:", tooltipText);
                }

                let cityLabelDiv = cell.querySelector('.day-city-labels');
                if (!cityLabelDiv) {
                    cityLabelDiv = document.createElement('div');
                    cityLabelDiv.classList.add('day-city-labels');
                    cell.appendChild(cityLabelDiv);
                }

                const citySpan = document.createElement('span');
                citySpan.classList.add('city-badge');
                citySpan.textContent = city.name;
                cityLabelDiv.appendChild(citySpan);

                currentMonthData.push({
                    date,
                    city: city.name,
                    classes: cell.className,
                    tooltipText: tooltipDiv.textContent
                });
            }
        }

        monthCache.set(monthYearKey, currentMonthData);

    } catch (error) {
    } finally {
        isUpdatingCalendarColors = false;
    }
}

function applyCachedData(calendarInstance, cachedData) {

    const groupedByDate = {};
    cachedData.forEach(entry => {
        const { date } = entry;
        if (!groupedByDate[date]) {
            groupedByDate[date] = [];
        }
        groupedByDate[date].push(entry);
    });

    Object.entries(groupedByDate).forEach(([date, cityEntries]) => {
        const cell = calendarInstance.getCellByDate(date);
        if (!cell) return;

        // Preserve existing disabled state
        const isDisabled = cell.classList.contains("disabled");

        // Pull classes/tooltip from the last entry for this date
        const { classes: cachedClasses, tooltipText } = cityEntries[cityEntries.length - 1];

        // Merge the cell’s existing classes with the cached classes
        const existingClasses = cell.className.split(/\s+/).filter(Boolean);
        const newClasses = (cachedClasses || "").split(/\s+/).filter(Boolean);
        const mergedClasses = new Set([...existingClasses, ...newClasses]);

        if (isDisabled) {
            mergedClasses.add('disabled');
        }

        cell.className = Array.from(mergedClasses).join(" ");

        // If there's a tooltip in the cache, ensure it exists in the DOM
        if (tooltipText) {
            let tooltipDiv = cell.querySelector(".cell-tooltip-popup");
            if (!tooltipDiv) {
                tooltipDiv = document.createElement("div");
                tooltipDiv.classList.add("cell-tooltip-popup");
                cell.appendChild(tooltipDiv);
            }
            tooltipDiv.textContent = tooltipText;
        }

        // Clear out any old badges
        const existingBadges = cell.querySelectorAll(".city-badge");
        existingBadges.forEach(badge => badge.remove());

        // Ensure we have a container for city badges
        let cityLabelDiv = cell.querySelector(".day-city-labels");
        if (!cityLabelDiv) {
            cityLabelDiv = document.createElement("div");
            cityLabelDiv.classList.add("day-city-labels");
            cell.appendChild(cityLabelDiv);
        }

        // Re-add all city badges from the cached entries
        cityEntries.forEach(({ city }) => {
            const citySpan = document.createElement("span");
            citySpan.classList.add("city-badge");
            citySpan.textContent = city;
            cityLabelDiv.appendChild(citySpan);
        });
    });
}
