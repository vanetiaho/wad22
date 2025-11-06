<template>
  <div class="favourites-section">
    <h1>MY FAVOURITE CAFES</h1>

    <div v-if="loading" class="loading">Loading your favourites...</div>

    <div v-else-if="favourites.length === 0" class="no-favourites">
      <p>You haven't added any favourites yet.</p>
      <router-link to="/reviews" class="browse-btn">Browse Cafes</router-link>
    </div>

    <div v-else class="favourites-grid">
      <div
        v-for="favourite in favourites"
        :key="favourite.id"
        class="favourite-card"
      >
        <router-link :to="`/cafe_review/${favourite.cafe_id}`" class="card-link">
          <img
            :src="getImageUrl(favourite.cafes?.image_url)"
            :alt="favourite.cafes?.cafe_name"
          />
          <div class="card-content">
            <h3>{{ favourite.cafes?.cafe_name }}</h3>
            <p class="address">{{ favourite.cafes?.address }}</p>
            <div class="amenities">
              <span v-if="favourite.cafes?.wifi" class="amenity">📶 WiFi</span>
              <span v-if="favourite.cafes?.power_outlets" class="amenity">🔌 Power</span>
            </div>
          </div>
        </router-link>
        <button @click="removeFavourite(favourite.cafe_id)" class="remove-btn">
          Remove
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getFavouriteCafes, removeFavourite as removeFav } from '../../lib/api/favourites'

const favourites = ref([])
const loading = ref(true)

const getImageUrl = (imageUrl) => {
  if (Array.isArray(imageUrl) && imageUrl.length > 0) {
    return imageUrl[0]
  }
  return imageUrl || 'https://via.placeholder.com/200'
}

const removeFavourite = async (cafeId) => {
  try {
    await removeFav(cafeId)
    favourites.value = favourites.value.filter(f => f.cafe_id !== cafeId)
  } catch (error) {
    console.error('Error removing favourite:', error)
    alert('Failed to remove favourite. Please try again.')
  }
}

onMounted(async () => {
  try {
    favourites.value = await getFavouriteCafes()
  } catch (error) {
    console.error('Error loading favourites:', error)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
h1 {
  text-align: center;    
  font-weight: 700;     
}

.favourites-section {
  padding: 60px 80px;
}

.favourites-section h1 {
  font-size: 48px;
  color: #fbe8d3;
  margin-bottom: 50px;
}

.loading {
  text-align: center;
  color: #fbe8d3;
  font-size: 20px;
  padding: 100px 0;
}

.no-favourites {
  text-align: center;
  color: #fbe8d3;
  padding: 100px 0;
}

.no-favourites p {
  font-size: 20px;
  margin-bottom: 30px;
}

.browse-btn {
  display: inline-block;
  padding: 15px 40px;
  background: linear-gradient(135deg, #F0EDEE 0%, #fbe8d3 100%);
  color: #5c3d2e;
  text-decoration: none;
  border-radius: 25px;
  font-weight: bold;
  transition: all 0.3s;
}

.browse-btn:hover {
  background-color: #d4a95f;
  transform: translateY(-3px);
}

.favourites-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 40px;
}

.favourite-card {
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  position: relative;
}

.favourite-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
}

.card-link {
  text-decoration: none;
  color: inherit;
  display: block;
}

.favourite-card img {
  width: 100%;
  height: 200px;
  object-fit: cover;
}

.card-content {
  padding: 20px;
}

.card-content h3 {
  font-size: 20px;
  color: #fbe8d3;
  margin-bottom: 10px;
}

.address {
  font-size: 14px;
  color: #e7bf8f;
  margin-bottom: 15px;
}

.amenities {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}

.amenity {
  font-size: 12px;
  color: #fbe8d3;
  background-color: rgba(255, 255, 255, 0.1);
  padding: 5px 10px;
  border-radius: 5px;
}

.remove-btn {
  width: calc(100% - 40px);
  margin: 0 20px 20px 20px;
  padding: 12px 16px;
  background-color: rgba(122, 28, 28, 0.45); /* slightly darker */
  border: none;
  border-radius: 25px;
  color: white;
  font-weight: bold;
  font-size: 16px;
  cursor: pointer;
  text-shadow: 1px 1px 3px rgba(80, 20, 20, 0.6); /* stronger text shadow */
  box-shadow:
    0 3px 8px rgba(122, 28, 28, 0.4); /* deeper shadow */
  transition: background-color 0.3s ease, box-shadow 0.3s ease,
              transform 0.2s ease;
}

.remove-btn:hover {
  background-color: rgba(122, 28, 28, 0.6);
  box-shadow:
    0 5px 14px rgba(122, 28, 28, 0.55);
  transform: translateY(-1px);
}

.remove-btn:active {
  background-color: rgba(122, 28, 28, 0.7);
  box-shadow: none;
  transform: translateY(0);
}

@media (max-width: 768px) {
  .favourites-section {
    padding: 30px 20px;
  }

  .favourites-section h1 {
    font-size: 32px;
  }
}
</style>