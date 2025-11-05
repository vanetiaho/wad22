<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from "vue";

let map, userMarker, infoWindow;
let Place;
let directionsService, directionsRenderer;
let allPlaces = [];
let cafeMarkers = [];

const fallbackLocation = { lat: 1.296568, lng: 103.852119 };
const showFilters = ref(false);
const travelMode = ref("WALKING"); // Default travel mode
let currentDestination = null; // Store current destination for recalculation

// Watch travel mode changes and recalculate if we have a destination
watch(travelMode, () => {
	if (currentDestination) {
		showDirections(currentDestination);
	}
});

// Filter state
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
	rating: [1.0, 5.0],
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
		suppressInfoWindows: false, // Show transit info
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
	// Only clear if we don't have markers yet
	if (cafeMarkers.length === 0) {
		allPlaces = [];
	}

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

				// Extract lat/lng properly from the new Places API
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

	// Create all markers initially
	if (cafeMarkers.length === 0) {
		allPlaces.forEach((place) => createStudyMarker(place));
	}
}

function updateVisibleMarkers() {
	// Don't clear markers - just hide/show them based on search
	const query = filters.value.searchQuery.toLowerCase();
	
	cafeMarkers.forEach(({ marker, place }) => {
		const name = (place.name || "").toLowerCase();
		const address = (place.formatted_address || "").toLowerCase();
		const matches = !query || name.includes(query) || address.includes(query);
		
		// Show or hide marker
		marker.map = matches ? map : null;
	});
	
	// If there's a search query, center map on first visible result
	if (query) {
		const visibleMarker = cafeMarkers.find(({ marker }) => marker.map !== null);
		if (visibleMarker) {
			const pos = visibleMarker.marker.position;
			map.setCenter({ lat: pos.lat, lng: pos.lng });
			map.setZoom(15);
		}
	}
}

// FIXED: Properly extract lat/lng from AdvancedMarkerElement position
function showDirections(placeLocation) {
	if (!userMarker || !directionsService || !directionsRenderer) {
		alert("Unable to get directions. Please enable location.");
		return;
	}

	// Get origin position
	const originPos = userMarker.position;

	// Create proper LatLng objects
	const origin = new google.maps.LatLng(originPos.lat, originPos.lng);
	const destination = new google.maps.LatLng(
		placeLocation.lat,
		placeLocation.lng
	);

	console.log("Origin:", origin.lat(), origin.lng());
	console.log("Destination:", destination.lat(), destination.lng());

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

	// FIXED: Store location object and pass it properly
	const markerLocation = {
		lat: place.geometry.location.lat,
		lng: place.geometry.location.lng,
	};

	marker.addListener("gmp-click", () => {
		const name = place.name || "Place";
		const address = place.formatted_address || "";

		// Store destination immediately when cafe is clicked
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

		// Add click listener after content is set
		setTimeout(() => {
			const btn = document.getElementById(
				`directions-btn-${cafeMarkers.length}`
			);
			if (btn) {
				btn.addEventListener("click", () => showDirections(markerLocation));
			}
		}, 100);
	});

	cafeMarkers.push({ marker, place });
}

function clearDirections() {
	if (directionsRenderer) {
		directionsRenderer.setDirections({ routes: [] });
	}
	currentDestination = null; // Clear stored destination
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

		<!-- Travel Mode Selector -->
		<div class="travel-mode-selector">
			<button
				:class="{ active: travelMode === 'WALKING' }"
				@click="travelMode = 'WALKING'"
			>
				🚶 Walking
			</button>
			<button
				:class="{ active: travelMode === 'DRIVING' }"
				@click="travelMode = 'DRIVING'"
			>
				🚗 Driving
			</button>
			<button
				:class="{ active: travelMode === 'BICYCLING' }"
				@click="travelMode = 'BICYCLING'"
			>
				🚴 Cycling
			</button>
		</div>

		<!-- DROPDOWN FILTER PANEL -->
		<div v-if="showFilters" class="filter-dropdown">
			<div class="top-filters">
				<!-- AMENITIES -->
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

				<!-- CROWD LEVEL -->
				<div class="filter-section">
					<h3>CROWD LEVEL</h3>
					<div class="crowd-row">
						<label class="crowd-label">
							<input type="checkbox" v-model="filters.crowdLevel.low" />
							<span class="crowd-icon">🧍</span>
						</label>
						<label class="crowd-label">
							<input type="checkbox" v-model="filters.crowdLevel.medium" />
							<span class="crowd-icon">🧍🧍</span>
						</label>
						<label class="crowd-label">
							<input type="checkbox" v-model="filters.crowdLevel.high" />
							<span class="crowd-icon">🧍🧍🧍</span>
						</label>
					</div>
				</div>

				<!-- PRICE RANGE -->
				<div class="filter-section">
					<h3>PRICE RANGE</h3>
					<div class="range-display">
						<span>${{ filters.priceRange[0] }}</span>
						<span>${{ filters.priceRange[1] }}</span>
					</div>
					<input
						type="range"
						v-model.number="filters.priceRange[0]"
						min="0"
						max="30"
						class="slider"
					/>
				</div>

				<!-- RATING -->
				<div class="filter-section">
					<h3>RATING</h3>
					<div class="range-display">
						<span>⭐{{ filters.rating[0] }}</span>
						<span>⭐{{ filters.rating[1] }}</span>
					</div>
					<input
						type="range"
						v-model.number="filters.rating[0]"
						min="1.0"
						max="5.0"
						step="0.1"
						class="slider"
					/>
				</div>
			</div>

			<!-- BOTTOM FILTERS -->
			<div class="bottom-filters">
				<!-- OPENING DAYS -->
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

				<!-- OPENING HOURS -->
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
							<input
								type="checkbox" v-model="filters.openingHours.open24hours"/>
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

/* TRAVEL MODE SELECTOR */
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

/* DROPDOWN FILTER STYLES */
.filter-dropdown {
  position: absolute; /* appear on top of map */
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

/* TOP FILTERS: 2-column grid */
.top-filters {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 30px;
  margin-bottom: 20px;
}

/* BOTTOM FILTERS: single-column */
.bottom-filters {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* Sections */
.filter-section {
  padding: 10px 0;
}

h3 {
  font-family: "Georgia", serif;
  font-size: 18px;
  color: #6d412a;
  margin-bottom: 10px;
}

/* Horizontal checkbox rows */
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

/* Crowd Level */
.crowd-row {
  display: flex;
  gap: 20px;
  align-items: center;
}

.crowd-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 80px; /* make it box-like */
}

.crowd-icon {
  font-size: 16px;
}

/* Sliders */
.range-display {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
  font-family: "Georgia", serif;
  color: #8b6f47;
  font-size: 14px;
}

.slider {
  width: 100%;
  height: 5px;
  border-radius: 5px;
  background: #d4a574;
  outline: none;
  margin-bottom: 10px;
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
	#search-bar {
		margin-left: 20px;
	}
	.angle-down-icon {
		left: 350px;
	}
	.filter-dropdown {
		width: 90vw;
	}
	.filter-row {
		grid-template-columns: 1fr;
	}
}

@media (max-width: 480px) {
	#search-bar {
		margin-left: 10px;
	}
	.angle-down-icon {
		left: 250px;
	}
}
</style>