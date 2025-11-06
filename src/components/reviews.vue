<template>
  <div class="reviews-section">
    <h1>REVIEWS</h1>


    <div id="search-bar">
      <div class="input-container">
        <FontAwesomeIcon icon="magnifying-glass" class="search-icon" />
        <input
          type="text"
          placeholder="Search Cafes..."
          v-model="searchQuery"
          @input="filterCafes"
        />
      </div>
    </div>

    <div class="reviews-grid">
      <div
        v-for="cafe in filteredCafes"
        :key="cafe.id"
        class="review-card"
      >
        <router-link
          :to="`/cafe_review/${cafe.id}`"
          class="card-link"
        >
          <img
            :src="getCafeImage(cafe)"
            :alt="cafe.cafe_name"
          />

          <h3>{{ cafe.cafe_name }}</h3>
          <p>{{ cafe.address }}</p>
          <p>
            Ratings:
            <span v-if="cafe.averageRating">
              <span v-for="n in 5" :key="n" class="star">
                <svg v-if="n <= Math.round(cafe.averageRating)" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#FFD700" viewBox="0 0 24 24">
                  <path d="M12 .587l3.668 7.431 8.2 1.192-5.934 5.777 1.4 8.17L12 18.896l-7.334 3.861 1.4-8.17L.132 9.21l8.2-1.192z"/>
                </svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="#FFD700" stroke-width="2" viewBox="0 0 24 24">
                  <path d="M12 .587l3.668 7.431 8.2 1.192-5.934 5.777 1.4 8.17L12 18.896l-7.334 3.861 1.4-8.17L.132 9.21l8.2-1.192z"/>
                </svg>
              </span>
              ({{ cafe.averageRating.toFixed(1) }})
            </span>
            <span v-else>—</span>
          </p>
        </router-link>

        <!-- Heart Button -->
        <button 
          @click.stop="toggleFavourite(cafe.id)"
          class="heart-btn"
          :class="{ 'is-favourite': favouriteIds.has(cafe.id) }"
        >
          <svg
            @click.stop="toggleFavourite(cafe.id)"
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
              :fill="favouriteIds.has(cafe.id) ? 'red' : 'none'"
              stroke="red"
              stroke-width="2"
              viewBox="0 0 24 24"
              style="cursor: pointer;"
            >
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>

        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import supabase from '../config/supabaseClient'
import { addFavourite, removeFavourite, getFavouriteCafes } from '../../lib/api/favourites'

const searchQuery = ref('')
const cafes = ref([])
const favouriteIds = ref(new Set())
const placeholderImage = 'https://picsum.photos/400/300?random=1'
const filteredCafes = ref([])

function filterCafes() {
  const query = searchQuery.value.toLowerCase()
  filteredCafes.value = cafes.value.filter(cafe =>
    cafe.cafe_name.toLowerCase().includes(query) ||
    cafe.address.toLowerCase().includes(query)
  )
}

async function loadCafes() {
  const { data: cafeData, error: cafeError } = await supabase.from('cafes').select('*')
  if (cafeError) console.error('Error fetching cafes:', cafeError)
  else {
    // Fetch reviews for all cafes
    const { data: reviews, error: reviewError } = await supabase.from('reviews').select('cafe_id, rating')
    if (reviewError) console.error('Error fetching reviews:', reviewError)
    // Compute average rating
    cafeData.forEach(cafe => {
      const cafeReviews = reviews.filter(r => r.cafe_id === cafe.id)
      cafe.averageRating = cafeReviews.length > 0
        ? cafeReviews.reduce((sum, r) => sum + r.rating, 0) / cafeReviews.length
        : null
    })

    cafes.value = cafeData
    filteredCafes.value = cafeData
  }
}

async function loadFavourites() {
  try {
    const favourites = await getFavouriteCafes()
    favouriteIds.value = new Set(favourites.map(fav => fav.cafe_id))
  } catch (error) {
    console.error('Error loading favourites:', error)
  }
}

async function toggleFavourite(cafeId) {
  try {
    if (favouriteIds.value.has(cafeId)) {
      await removeFavourite(cafeId)
      favouriteIds.value.delete(cafeId)
    } else {
      await addFavourite(cafeId)
      favouriteIds.value.add(cafeId)
    }
  } catch (error) {
    console.error('Error toggling favourite:', error)
    alert('Failed to update favourite. Please try again.')
  }
}

function getCafeImage(cafe) {
  if (Array.isArray(cafe.image_url) && cafe.image_url.length > 0) {
    return cafe.image_url[0]  // use first image
  } else if (typeof cafe.image_url === 'string' && cafe.image_url) {
    return cafe.image_url
  } else {
    return placeholderImage   // fallback
  }
}


onMounted(() => {
  loadCafes()
  loadFavourites()
})
</script>

<style scoped>
.card-link {
  text-decoration: none !important;
  color: inherit !important;
}
.reviews-section {
  padding: 60px 80px;
  text-align: left;
}

.reviews-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 40px;
}

.review-card {
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 20px;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  color: inherit;
  position: relative;
}

.review-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
}

.card-link {
  text-decoration: none;
  color: inherit;
  display: block;
}

.review-card img {
  width: 100%;
  height: 200px;
  object-fit: cover;
  border-radius: 10px;
  margin-bottom: 15px;
}

.review-card h3 {
  font-size: 18px;
  margin-bottom: 10px;
  color: #fbe8d3;
}

.review-card p {
  font-size: 14px;
  color: #fbe8d3;
}

.star {
  opacity: 0.3;
  margin-right: 2px;
}

.star.filled {
  opacity: 1;
}

.heart-btn {
  position: absolute;
  bottom: 20px;
  right: 20px;
  background: transparent;      /* no background */
  border: none;                 /* no border */
  padding: 0;                   /* no padding */
  margin: 0;                    /* no margin */
  width: 24px;                  /* same size as SVG */
  height: 24px;
  cursor: pointer;
  outline: none;                /* remove focus outline if needed */
}

.heart-btn svg {
  filter: drop-shadow(0 0 3px rgba(255, 0, 0, 0.7)); /* subtle red shadow around heart */
  transition: fill 0.3s ease;
  display: block;
  pointer-events: none;         /* so only button handles clicks */
}

.heart-btn.is-favourite svg {
  fill: red !important;         /* make sure heart fills red when favourited */
}

#search-bar {
  text-align: left;
  margin-left: 80px;
  margin-top: 30px;
  margin-bottom: 20px;
  position: relative;
}

.input-container {
  position: relative;
  display: inline-block;
  width: 100%;
  max-width: 500px;
}

.search-icon {
  position: absolute;
  left: 15px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  color: #6d412a;
}

#search-bar input {
  border-radius: 30px;
  border: 1px solid #ccc;
  padding: 12px 15px 12px 40px; /* space for magnifying glass */
  width: 100%;
  background-color: #fdf9ee;
  box-sizing: border-box;
  font-family: "Georgia", serif;
  font-size: 15px;
  transition: box-shadow 0.3s ease, border-color 0.3s ease;
}

#search-bar input:focus {
  outline: none;
  border-color: #a67c52;
  box-shadow: 0 0 6px rgba(166, 124, 82, 0.4);
}


</style>
