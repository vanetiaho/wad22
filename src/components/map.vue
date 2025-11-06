<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from "vue";
import supabase from '../config/supabaseClient'




let map, userMarker, infoWindow;
let Place;
let directionsService, directionsRenderer;
let allPlaces = [];
let cafeMarkers = [];




const fallbackLocation = { lat: 1.296568, lng: 103.852119 };
const showFilters = ref(false);
const travelMode = ref("WALKING");
let currentDestination = null;




const dbCafes = ref([]);




// HELPER FUNCTION: Normalize names for consistent matching
function normalizeName(name) {
  if (!name) return '';
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/[^\w\s@]/g, '') // Keep alphanumeric, spaces, and @ symbol
    .replace(/\s+/g, ''); // Remove all spaces for matching
}




watch(travelMode, () => {
    if (currentDestination) {
        showDirections(currentDestination);
    }
});




const filters = ref({
    searchQuery: "",
    amenities: {
        wifi: false,
        powerOutlets: false,
    },
    crowdLevel: {
        low: false,
        medium: false,
        high: false,
    },
    priceRange: [0, 30],
    rating: 1.0,
    openingDays: {
        weekdays: false,
        weekends: false,
    },
    openingHours: {
        before9am: false,
        after10pm: false,
        open24hours: false,
    },
});




watch(
    filters,
    () => {
        updateVisibleMarkers();
    },
    { deep: true }
);




async function getLatestCrowdLevels() {
  try {
    console.log('Fetching crowd levels...');
    const { data, error } = await supabase
      .from('crowd')
      .select('cafe_name, crowd_level, created_at')
      .order('created_at', { ascending: false });




    if (error) {
      console.error('Error fetching crowd levels:', error);
      return {};
    }




    console.log('Raw crowd data:', data);




    const latestCrowd = {};
    data.forEach(entry => {
      const normalizedName = normalizeName(entry.cafe_name);
      if (!latestCrowd[normalizedName]) {
        latestCrowd[normalizedName] = entry.crowd_level;
      }
    });




    console.log('Latest crowd levels (normalized):', latestCrowd);
    return latestCrowd;
  } catch (err) {
    console.error('Unexpected error:', err);
    return {};
  }
}




async function fetchCafesFromDatabase() {
  try {
    console.log('Fetching cafes with filters:', filters.value);
   
    const { data, error } = await supabase
      .from('cafes')
      .select('*');




    if (error) {
      console.error('Error fetching cafes:', error);
      return [];
    }
   
    console.log('Fetched all cafes from database:', data?.length, 'cafes');




    // Check which filters are active
    const wifiFilterActive = filters.value.amenities.wifi;
    const powerFilterActive = filters.value.amenities.powerOutlets;
    const priceFilterActive = filters.value.priceRange[0] !== 0 || filters.value.priceRange[1] !== 30;
    const ratingFilterActive = filters.value.rating !== 1.0;
    const crowdFilterActive = filters.value.crowdLevel.low ||
                               filters.value.crowdLevel.medium ||
                               filters.value.crowdLevel.high;
    const openingDaysFilterActive = filters.value.openingDays.weekdays ||
                                    filters.value.openingDays.weekends;
    const openingHoursFilterActive = filters.value.openingHours.before9am ||
                                     filters.value.openingHours.after10pm ||
                                     filters.value.openingHours.open24hours;




    const anyFilterActive = wifiFilterActive || powerFilterActive || priceFilterActive ||
                            ratingFilterActive || crowdFilterActive ||
                            openingDaysFilterActive || openingHoursFilterActive;




    if (!anyFilterActive) {
      console.log('No filters active, returning all cafes');
      dbCafes.value = data;
      return data;
    }




    // Get crowd levels if crowd filter is active
    let crowdLevels = {};
    if (crowdFilterActive) {
      crowdLevels = await getLatestCrowdLevels();
    }




    // Apply AND logic - all active filters must pass
    let filteredData = data.filter(cafe => {
      console.log(`Checking cafe: ${cafe.cafe_name}`);




      // WiFi filter - if active, cafe MUST have WiFi
      if (wifiFilterActive && cafe.wifi !== true) {
        console.log(`  ❌ Failed WiFi filter`);
        return false;
      }




      // Power Outlets filter - if active, cafe MUST have power outlets
      if (powerFilterActive && cafe.power_outlets !== true) {
        console.log(`  ❌ Failed Power Outlets filter`);
        return false;
      }




      // Price Range filter - if active, cafe MUST be within range
      if (priceFilterActive) {
        if (cafe.price_range === null || cafe.price_range === undefined) {
          console.log(`  ❌ Failed Price filter (no price data)`);
          return false;
        }
        if (cafe.price_range < filters.value.priceRange[0] ||
            cafe.price_range > filters.value.priceRange[1]) {
          console.log(`  ❌ Failed Price filter ($${cafe.price_range} not in range $${filters.value.priceRange[0]}-$${filters.value.priceRange[1]})`);
          return false;
        }
      }




      // Rating filter - if active, cafe MUST meet minimum rating
      if (ratingFilterActive) {
        if (cafe.rating === null || cafe.rating === undefined) {
          console.log(`  ❌ Failed Rating filter (no rating data)`);
          return false;
        }
        if (cafe.rating < filters.value.rating) {
          console.log(`  ❌ Failed Rating filter (${cafe.rating} below minimum ${filters.value.rating})`);
          return false;
        }
      }




      // Crowd Level filter - if active, cafe MUST match selected crowd level(s)
      if (crowdFilterActive) {
        const normalizedName = normalizeName(cafe.cafe_name);
        const level = crowdLevels[normalizedName];
       
        if (!level) {
          console.log(`  ❌ Failed Crowd filter (no crowd data)`);
          return false;
        }




        const matchesCrowdLevel =
          (filters.value.crowdLevel.low && level === 1) ||
          (filters.value.crowdLevel.medium && level === 2) ||
          (filters.value.crowdLevel.high && level === 3);




        if (!matchesCrowdLevel) {
          console.log(`  ❌ Failed Crowd filter (level ${level} not selected)`);
          return false;
        }
      }




      // Opening Days filter - if active, cafe MUST be open on selected days
      if (openingDaysFilterActive) {
        let matchesOpeningDays = false;
       
        // If weekdays is checked, cafe must be open on weekdays
        if (filters.value.openingDays.weekdays && cafe.open_weekdays === true) {
          matchesOpeningDays = true;
        }
       
        // If weekends is checked, cafe must be open on weekends
        if (filters.value.openingDays.weekends && cafe.open_weekends === true) {
          matchesOpeningDays = true;
        }
       
        if (!matchesOpeningDays) {
          console.log(`  ❌ Failed Opening Days filter`);
          return false;
        }
      }




      // Opening Hours filter - if active, cafe MUST match at least ONE selected criteria (OR logic)
      if (openingHoursFilterActive) {
        let matchesOpeningHours = false;

        // Check if cafe matches ANY of the selected opening hours criteria
        if (filters.value.openingHours.before9am && cafe.opens_before_9am === true) {
          console.log(`  ✅ Matches Opens before 9am filter`);
          matchesOpeningHours = true;
        }

        if (filters.value.openingHours.after10pm && cafe.closes_after_10pm === true) {
          console.log(`  ✅ Matches Closes after 10pm filter`);
          matchesOpeningHours = true;
        }

        if (filters.value.openingHours.open24hours && cafe.open_24_hours === true) {
          console.log(`  ✅ Matches Open 24 hours filter`);
          matchesOpeningHours = true;
        }

        // If none of the selected criteria matched, exclude this cafe
        if (!matchesOpeningHours) {
          console.log(`  ❌ Failed Opening Hours filter (no criteria matched)`);
          return false;
        }
      }




      console.log(`  ✅ Passed all filters`);
      return true;
    });




    console.log('After filtering:', filteredData.length, 'cafes');
    dbCafes.value = filteredData;
    return filteredData;
  } catch (err) {
    console.error('Unexpected error:', err);
    return [];
  }
}




async function initMap() {
    const mapElement = document.getElementById("map");
    if (!mapElement) return;




    map = new google.maps.Map(mapElement, {
        center: fallbackLocation,
        zoom: 12,
        mapId: "c7b9f61341e2c2aee540fd8c",
    });




    const { Place: PlaceClass } = await google.maps.importLibrary("places");
    Place = PlaceClass;




    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer({
        map: map,
        suppressMarkers: true,
        polylineOptions: {
            strokeColor: "#6d412a",
            strokeWeight: 4,
        },
        preserveViewport: false,
        suppressInfoWindows: false,
        provideRouteAlternatives: false,
    });




    infoWindow = new google.maps.InfoWindow();
    map.addListener("idle", () => searchNearbyStudySpots());




    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const position = {
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                };
                setUserMarker(position);
                map.setCenter(position);
                map.setZoom(15);
                searchNearbyStudySpots();
            },
            () => {
                setUserMarker(fallbackLocation);
                map.setCenter(fallbackLocation);
                map.setZoom(12);
                searchNearbyStudySpots();
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    } else {
        setUserMarker(fallbackLocation);
        map.setCenter(fallbackLocation);
        map.setZoom(12);
        searchNearbyStudySpots();
    }




    const locationButton = document.createElement("button");
    locationButton.textContent = "Pan to Current Location";
    locationButton.classList.add("custom-map-control-button");
    map.controls[google.maps.ControlPosition.TOP_CENTER].push(locationButton);
    locationButton.addEventListener("click", () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const position = {
                        lat: pos.coords.latitude,
                        lng: pos.coords.longitude,
                    };
                    setUserMarker(position);
                    map.setZoom(15);
                    map.setCenter(position);
                    searchNearbyStudySpots();
                },
                () => {
                    setUserMarker(fallbackLocation);
                    map.setZoom(12);
                    map.setCenter(fallbackLocation);
                    searchNearbyStudySpots();
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
        }
    });
}




function setUserMarker(pos) {
    const blueDot = document.createElement("div");
    blueDot.style.width = "16px";
    blueDot.style.height = "16px";
    blueDot.style.backgroundColor = "#4285F4";
    blueDot.style.border = "2px solid white";
    blueDot.style.borderRadius = "50%";
    blueDot.style.boxShadow = "0 0 4px rgba(0,0,0,0.3)";




    if (userMarker) {
        userMarker.position = pos;
    } else {
        userMarker = new google.maps.marker.AdvancedMarkerElement({
            position: pos,
            map,
            content: blueDot,
        });
    }
}




function clearCafeMarkers() {
    cafeMarkers.forEach((m) => {
        if (typeof m.marker.setMap === "function") m.marker.setMap(null);
        else m.marker.map = null;
    });
    cafeMarkers = [];
}




async function searchNearbyStudySpots() {
    if (!Place || !map) return;
    clearCafeMarkers();
    allPlaces = [];




    const center = map.getCenter();
    if (!center) return;




    const queries = [
        { query: "library", type: "library" },
        { query: "study cafe", type: "cafe" },
        { query: "coworking space", type: "coworking" },
        { query: "co-working space", type: "coworking" },
        { query: "Staytion", type: "coworking" },
        { query: "The Chill Mug", type: "coworking" },
    ];




    const seenKeys = new Set();




    for (const { query, type } of queries) {
        try {
            const request = {
                textQuery: query,
                locationBias: center,
                maxResultCount: 10,
                fields: ["displayName", "formattedAddress", "location", "types"],
            };




            const { places } = await Place.searchByText(request);




            for (const p of places) {
                const uniqueKey = p.displayName + (p.formattedAddress || "");
                if (seenKeys.has(uniqueKey)) continue;
                seenKeys.add(uniqueKey);




                const lat =
                    typeof p.location.lat === "function"
                        ? p.location.lat()
                        : p.location.lat;
                const lng =
                    typeof p.location.lng === "function"
                        ? p.location.lng()
                        : p.location.lng;




                allPlaces.push({
                    name: p.displayName,
                    geometry: {
                        location: {
                            lat: lat,
                            lng: lng,
                        },
                    },
                    types: p.types || [],
                    formatted_address: p.formattedAddress,
                    expectedType: type,
                });
            }
        } catch (err) {
            console.warn("Places search error:", err);
        }
    }




    console.log('Found', allPlaces.length, 'places from Google Maps API');
    updateVisibleMarkers();
}




async function updateVisibleMarkers() {
  console.log('Updating visible markers...');
  clearCafeMarkers();




  const dbFilteredCafes = await fetchCafesFromDatabase();
  console.log('DB filtered cafes:', dbFilteredCafes.length);
 
  const allowedCafeNames = new Set(
    dbFilteredCafes.map(cafe => normalizeName(cafe.cafe_name))
  );
 
  console.log('Allowed cafe names (normalized):', Array.from(allowedCafeNames));
  console.log('Total allowed cafes:', allowedCafeNames.size);




  const filtered = allPlaces.filter((place) => {
    const normalizedPlaceName = normalizeName(place.name);
   
    console.log('Checking place:', place.name, '| Normalized:', normalizedPlaceName);
   
    // SEARCH QUERY FILTER - works independently
    if (filters.value.searchQuery) {
      const query = filters.value.searchQuery.toLowerCase().trim();
      const placeName = place.name.toLowerCase();
      const address = (place.formatted_address || "").toLowerCase();
     
      // Must match search query
      if (!placeName.includes(query) && !address.includes(query)) {
        console.log('❌ Search filter: Does not match query:', place.name);
        return false;
      }
      console.log('✅ Search filter: Matches query:', place.name);
    }




    // Check if any other filters are active
    const hasActiveFilters =
      filters.value.amenities.wifi ||
      filters.value.amenities.powerOutlets ||
      filters.value.crowdLevel.low ||
      filters.value.crowdLevel.medium ||
      filters.value.crowdLevel.high ||
      filters.value.priceRange[0] !== 0 ||
      filters.value.priceRange[1] !== 30 ||
      filters.value.rating !== 1.0 ||
      filters.value.openingDays.weekdays ||
      filters.value.openingDays.weekends ||
      filters.value.openingHours.before9am ||
      filters.value.openingHours.after10pm ||
      filters.value.openingHours.open24hours;




    // If other filters are active, must be in allowed list
    if (hasActiveFilters) {
      const matches = allowedCafeNames.has(normalizedPlaceName);
     
      if (matches) {
        console.log('✅ Filter match:', place.name, '(normalized:', normalizedPlaceName + ')');
      } else {
        console.log('❌ Filter mismatch:', place.name, '(normalized:', normalizedPlaceName + ')');
      }
     
      return matches;
    }




    // No filters active (or only search), show the place
    return true;
  });




  console.log('Final filtered places to show:', filtered.length);
  console.log('Place names:', filtered.map(p => p.name));
 
  filtered.forEach((place) => createStudyMarker(place));
}




function showDirections(placeLocation) {
    if (!userMarker || !directionsService || !directionsRenderer) {
        alert("Unable to get directions. Please enable location.");
        return;
    }




    const originPos = userMarker.position;
    const origin = new google.maps.LatLng(originPos.lat, originPos.lng);
    const destination = new google.maps.LatLng(
        placeLocation.lat,
        placeLocation.lng
    );




    const request = {
        origin: origin,
        destination: destination,
        travelMode: travelMode.value,
    };




    directionsService.route(request, (result, status) => {
        if (status === google.maps.DirectionsStatus.OK) {
            directionsRenderer.setDirections(result);
        } else {
            console.error("Directions request failed:", status);
            alert("Could not get directions. Please try again.");
        }
    });
}




function createStudyMarker(place) {
    if (!place.geometry || !place.geometry.location) return;




    const types = place.types || [];
    let emoji = "💼";
    let border = "#1a202c";




    if (place.expectedType === "library" || types.includes("library")) {
        emoji = "📚";
        border = "#2b6cb0";
    } else if (place.expectedType === "cafe" || types.includes("cafe")) {
        emoji = "☕";
        border = "#6b4f4f";
    }




    const pin = document.createElement("div");
    pin.style.width = "28px";
    pin.style.height = "28px";
    pin.style.borderRadius = "50%";
    pin.style.background = "#fff";
    pin.style.border = `2px solid ${border}`;
    pin.style.boxShadow = "0 2px 6px rgba(0,0,0,0.3)";
    pin.style.display = "flex";
    pin.style.alignItems = "center";
    pin.style.justifyContent = "center";
    pin.style.userSelect = "none";
    pin.style.transform = "translateY(-2px)";
    pin.textContent = emoji;
    pin.style.fontSize = "16px";




    const marker = new google.maps.marker.AdvancedMarkerElement({
        position: {
            lat: place.geometry.location.lat,
            lng: place.geometry.location.lng,
        },
        map,
        content: pin,
        title: place.name || "Place",
    });




    const markerLocation = {
        lat: place.geometry.location.lat,
        lng: place.geometry.location.lng,
    };




    marker.addListener("gmp-click", () => {
        const name = place.name || "Place";
        const address = place.formatted_address || "";




        currentDestination = markerLocation;




        const content = `
            <div style="color: black; max-width: 250px;">
                <strong style="font-size: 16px;">${name}</strong><br/>
                <p style="margin: 8px 0; font-size: 14px;">${address}</p>
                <button
                    id="directions-btn-${cafeMarkers.length}"
                    style="
                        background-color: #6d412a;
                        color: white;
                        border: none;
                        padding: 8px 16px;
                        border-radius: 5px;
                        cursor: pointer;
                        font-size: 14px;
                        margin-top: 5px;
                    "
                >
                    Get Directions 🗺️
                </button>
            </div>
        `;




        infoWindow.setContent(content);
        infoWindow.open({ anchor: marker, map });




        setTimeout(() => {
            const directionsBtn = document.getElementById(
                `directions-btn-${cafeMarkers.length}`
            );
            if (directionsBtn) {
                directionsBtn.addEventListener("click", () => showDirections(markerLocation));
            }
        }, 100);
    });




    cafeMarkers.push({ marker, place });
}




function clearDirections() {
    if (directionsRenderer) {
        directionsRenderer.setDirections({ routes: [] });
    }
    currentDestination = null;
}




function toggleFilters() {
    showFilters.value = !showFilters.value;
}




onMounted(() => {
    const checkGoogleMaps = () => {
        if (window.google && window.google.maps && window.google.maps.marker) {
            console.log("Google Maps loaded successfully");
            initMap();
        } else setTimeout(checkGoogleMaps, 100);
    };
    checkGoogleMaps();
});




onBeforeUnmount(() => {
    clearCafeMarkers();
    if (userMarker) userMarker.map = null;
    if (infoWindow) infoWindow.close();
    clearDirections();
});




defineExpose({ filters, clearDirections });
</script>




<template>
    <div id="search-bar">
        <div class="input-container">
            <FontAwesomeIcon icon="magnifying-glass" class="search-icon" />
            <input
                type="text"
                placeholder="Search Cafes..."
                v-model="filters.searchQuery"
            />
            <FontAwesomeIcon
                icon="angle-down"
                class="angle-down-icon"
                @click="toggleFilters"
                :style="{
                    transform: showFilters
                        ? 'translateY(-50%) rotate(180deg)'
                        : 'translateY(-50%)',
                }"
            />
        </div>




        <div class="travel-mode-selector">
            <button
                :class="{ active: travelMode === 'WALKING' }"
                @click="travelMode = 'WALKING'"
            >
                Walking
            </button>
            <button
                :class="{ active: travelMode === 'DRIVING' }"
                @click="travelMode = 'DRIVING'"
            >
                Driving
            </button>
            <button
                :class="{ active: travelMode === 'TRANSIT' }"
                @click="travelMode = 'TRANSIT'"
            >
                Transit
            </button>
            <button
                :class="{ active: travelMode === 'BICYCLING' }"
                @click="travelMode = 'BICYCLING'"
            >
                Cycling
            </button>
        </div>




        <div v-if="showFilters" class="filter-dropdown">
            <div class="top-filters">
                <div class="filter-section">
                    <h3>AMENITIES</h3>
                    <div class="checkbox-row">
                        <label class="checkbox-label">
                            <input type="checkbox" v-model="filters.amenities.wifi" />
                            <span>WiFi</span>
                        </label>
                        <label class="checkbox-label">
                            <input type="checkbox" v-model="filters.amenities.powerOutlets" />
                            <span>Power Outlets</span>
                        </label>
                    </div>
                </div>




                <div class="filter-section">
                    <h3>CROWD LEVEL</h3>
                    <div class="crowd-row">
                        <label class="crowd-label">
                            <input type="checkbox" v-model="filters.crowdLevel.low" />
                            <span class="crowd-icon">Low</span>
                        </label>
                        <label class="crowd-label">
                            <input type="checkbox" v-model="filters.crowdLevel.medium" />
                            <span class="crowd-icon">Medium</span>
                        </label>
                        <label class="crowd-label">
                            <input type="checkbox" v-model="filters.crowdLevel.high" />
                            <span class="crowd-icon">High</span>
                        </label>
                    </div>
                </div>




                <div class="filter-section">
                    <h3>PRICE RANGE</h3>
                    <div class="range-display">
                        <span>${{ filters.priceRange[0] }}</span>
                        <span>${{ filters.priceRange[1] }}</span>
                    </div>
                    <div class="dual-slider">
                        <label>Min: ${{ filters.priceRange[0] }}</label>
                        <input
                            type="range"
                            v-model.number="filters.priceRange[0]"
                            min="0"
                            :max="filters.priceRange[1]"
                            class="slider"
                        />
                        <label>Max: ${{ filters.priceRange[1] }}</label>
                        <input
                            type="range"
                            v-model.number="filters.priceRange[1]"
                            :min="filters.priceRange[0]"
                            max="30"
                            class="slider"
                        />
                    </div>
                </div>




                <div class="filter-section">
                    <h3>MINIMUM RATING</h3>
                    <div class="range-display">
                        <span>{{ filters.rating }} stars</span>
                        <span>5.0 stars</span>
                    </div>
                    <input
                        type="range"
                        v-model.number="filters.rating"
                        min="1.0"
                        max="5.0"
                        step="0.1"
                        class="slider"
                    />
                </div>
            </div>




            <div class="bottom-filters">
                <div class="filter-section">
                    <h3>OPENING DAYS</h3>
                    <div class="checkbox-row">
                        <label class="checkbox-label">
                            <input type="checkbox" v-model="filters.openingDays.weekdays" />
                            <span>Weekdays</span>
                        </label>
                        <label class="checkbox-label">
                            <input type="checkbox" v-model="filters.openingDays.weekends" />
                            <span>Weekends</span>
                        </label>
                    </div>
                </div>




                <div class="filter-section">
                    <h3>OPENING HOURS</h3>
                    <div class="checkbox-row">
                        <label class="checkbox-label">
                            <input type="checkbox" v-model="filters.openingHours.before9am" />
                            <span>Opens before 9am</span>
                        </label>
                        <label class="checkbox-label">
                            <input type="checkbox" v-model="filters.openingHours.after10pm" />
                            <span>Closes after 10pm</span>
                        </label>
                    </div>
                    <div class="checkbox-row">
                        <label class="checkbox-label">
                            <input type="checkbox" v-model="filters.openingHours.open24hours" />
                            <span>Open 24 hours</span>
                        </label>
                    </div>
                </div>
            </div>
        </div>
    </div>




    <div id="map-container">
        <div id="map"></div>
    </div>
</template>




<style scoped>
.input-container {
    position: relative;
}




.search-icon {
    position: absolute;
    left: 20px;
    top: 50%;
    transform: translateY(-50%);
    pointer-events: none;
    color: #6d412a;
}




#search-bar input {
    border-radius: 30px;
    border: 1px solid #ccc;
    padding: 20px 20px 20px 50px;
    width: 100%;
    max-width: 500px;
    background-color: #fdf9ee;
    box-sizing: border-box;
    font-family: "Georgia", serif;
}




.angle-down-icon {
    position: absolute;
    left: 450px;
    top: 50%;
    transform: translateY(-50%);
    cursor: pointer;
    color: #6d412a;
    transition: transform 0.3s;
}




#search-bar {
    text-align: left;
    margin-left: 80px;
    margin-top: 40px;
    margin-bottom: 30px;
    position: relative;
}




.travel-mode-selector {
    display: flex;
    gap: 10px;
    margin-top: 15px;
}




.travel-mode-selector button {
    background-color: #fdf9ee;
    border: 2px solid #6d412a;
    color: #6d412a;
    padding: 8px 16px;
    border-radius: 20px;
    cursor: pointer;
    font-family: "Georgia", serif;
    font-size: 13px;
    transition: all 0.3s;
}




.travel-mode-selector button.active {
    background-color: #6d412a;
    color: #fdf9ee;
}




.travel-mode-selector button:hover {
    background-color: #8b5a3c;
    color: white;
    border-color: #8b5a3c;
}




.filter-dropdown {
    position: absolute;
    top: 70px;
    left: 0;
    background-color: #fdf9ee;
    border: 2px solid #6d412a;
    border-radius: 15px;
    padding: 25px;
    width: 700px;
    max-height: 500px;
    overflow-y: auto;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 1000;
}




.top-filters {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 30px;
    margin-bottom: 20px;
}




.bottom-filters {
    display: flex;
    flex-direction: column;
    gap: 20px;
}




.filter-section {
    padding: 10px 0;
}




h3 {
    font-family: "Georgia", serif;
    font-size: 18px;
    color: #6d412a;
    margin-bottom: 10px;
}




.checkbox-row {
    display: flex;
    gap: 20px;
    flex-wrap: wrap;
    align-items: center;
}




.checkbox-label {
    display: flex;
    align-items: center;
    font-family: "Georgia", serif;
    color: #8b6f47;
    font-size: 14px;
}




.checkbox-label input[type="checkbox"] {
    width: 16px;
    height: 16px;
    margin-right: 8px;
    accent-color: #6d412a;
}




.crowd-row {
    display: flex;
    gap: 20px;
    align-items: center;
}




.crowd-label {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 80px;
}




.crowd-icon {
    font-size: 16px;
}




.range-display {
    display: flex;
    justify-content: space-between;
    margin-bottom: 5px;
    font-family: "Georgia", serif;
    color: #8b6f47;
    font-size: 14px;
}




.dual-slider {
    display: flex;
    flex-direction: column;
    gap: 8px;
}




.dual-slider label {
    font-family: "Georgia", serif;
    color: #8b6f47;
    font-size: 13px;
    font-weight: 600;
}




.slider {
    width: 100%;
    height: 5px;
    border-radius: 5px;
    background: #d4a574;
    outline: none;
    margin-bottom: 10px;
}




.slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #6d412a;
    cursor: pointer;
}




.slider::-moz-range-thumb {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #6d412a;
    cursor: pointer;
    border: none;
}




#map {
    height: 100vh;
    width: 100%;
    border: 3px solid #6d412a;
}




#map-container {
    margin: 0px 80px 80px 80px;
    padding: 25px;
    background-color: #fdf9ee;
    border-radius: 10px;
    /* box-sizing: border-box; */

}




:global(.custom-map-control-button) {
    background-color: white;
    border: 2px solid white;
    border-radius: 3px;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
    color: rgb(25, 25, 25);
    cursor: pointer;
    font-family: Roboto, Arial, sans-serif;
    font-size: 16px;
    line-height: 38px;
    margin: 8px 0 22px;
    padding: 0 5px;
    text-align: center;
}




:global(.custom-map-control-button:hover) {
    background-color: #fbe8d3;
    border: 2px solid #fbe8d3;
}




@media (max-width: 768px) {
    #map-container {
        margin: 0 10px 20px 10px; /* smaller margins */
        padding: 15px;             /* smaller padding */
    }
    #search-bar {
        margin-left: 20px;
        margin-right: 20px;
    }
    .angle-down-icon {
        left: 450px;
    }
    .filter-dropdown {
        width: 90vw;
    }
    .top-filters {
        grid-template-columns: 1fr;
    }
}




@media (max-width: 480px) {
    #map-container {
        margin: 0 5px 10px 5px;
        padding: 15px;
    }
    #map {
        height: 50vh; /* still keep padding, but prevent squeezing */
        min-height: 250px;
    }
    #search-bar {
        margin-left: 10px;
        margin-right: 10px;
    }
    .angle-down-icon {
        left: 320px;
    }
}
</style>