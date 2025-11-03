<template>
  <div class="reviews-section">
    <h1>REVIEWS</h1>
    <div class="search-bar-container">
      <input
        type="text"
        v-model="searchQuery"
        @input="filterCafes"
        placeholder="Search cafes..."
        class="search-bar"
      />
    </div>

    <div class="reviews-grid">
      <div
        v-for="cafe in cafes"
        :key="cafe.id"
        class="review-card"
      >
        <router-link
          :to="`/cafe_review/${cafe.id}`"
          class="card-link"
        >
          <img
            :src="(Array.isArray(cafe.image_url) ? cafe.image_url[0] : cafe.image_url) || placeholderImage"
            :alt="cafe.cafe_name"
          />
          <h3>{{ cafe.cafe_name }}</h3>
          <p>{{ cafe.address }}</p>
          <p>
            Ratings:
            <span v-if="cafe.averageRating">
              <span v-for="n in 5" :key="n" class="star" :class="{ filled: n <= Math.round(cafe.averageRating) }">⭐</span>
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
          {{ favouriteIds.has(cafe.id) ? '❤️' : '🤍' }}
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
const placeholderImage = 'https://via.placeholder.com/200'

const filteredCafes = ref([])

function filterCafes() {
  const query = searchQuery.value.toLowerCase()
  filteredCafes.value = cafes.value.filter(cafe =>
    cafe.cafe_name.toLowerCase().includes(query) ||
    cafe.address.toLowerCase().includes(query)
  )
}

async function loadCafes() {
  const { data, error } = await supabase.from('cafes').select('*')
  if (error) {
    console.error('❌ Error fetching cafes:', error)
  } else {
    cafes.value = data.sort((a, b) => {
      const aHasImage = Array.isArray(a.image_url) ? a.image_url.length > 0 : !!a.image_url
      const bHasImage = Array.isArray(b.image_url) ? b.image_url.length > 0 : !!b.image_url
      return bHasImage - aHasImage
    })
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
      // Remove from favourites
      await removeFavourite(cafeId)
      favouriteIds.value.delete(cafeId)
    } else {
      // Add to favourites
      await addFavourite(cafeId)
      favouriteIds.value.add(cafeId)
    }
  } catch (error) {
    console.error('Error toggling favourite:', error)
    alert('Failed to update favourite. Please try again.')
  }
}

onMounted(() => {
  loadCafes()
  loadFavourites()
})
// Update filteredCafes whenever cafes load
watch(cafes, () => {
  filteredCafes.value = cafes.value
})
</script>

<style scoped>
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

/* Heart Button */
.heart-btn {
  position: absolute;
  top: 30px;
  right: 30px;
  background-color: rgba(255, 255, 255, 0.9);
  border: none;
  border-radius: 50%;
  width: 45px;
  height: 45px;
  font-size: 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  z-index: 10;
}

.heart-btn:hover {
  transform: scale(1.15);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.heart-btn.is-favourite {
  background-color: rgba(255, 200, 200, 0.95);
}

.search-bar-container {
  position: sticky;
  top: 0;
  z-index: 20;
  padding: 30px 0;
  border-bottom: 30px 
}

.search-bar {
  width: 100%;
  max-width: 400px;
  padding: 10px 15px;
  border-radius: 8px;
  border: 1px solid #ccc;
  font-size: 14px;
}

</style>
