<template>
  <div class="my-reviews-section">
    <h1>MY REVIEWS</h1>

    <div v-if="loading" class="loading">Loading your reviews...</div>

    <div v-else-if="reviews.length === 0" class="no-reviews">
      <p>You haven't reviewed any cafes yet.</p>
      <router-link to="/reviews" class="browse-btn">Browse Cafes</router-link>
    </div>

    <div v-else class="reviews-grid">
      <router-link
        v-for="review in reviews"
        :key="review.review_id"
        :to="`/cafe_review/${review.cafe_id}`"
        class="review-card"
      >
        <img
          :src="getImageUrl(review.cafes?.image_url)"
          :alt="review.cafes?.cafe_name"
        />
        <div class="review-content">
          <h3>{{ review.cafes?.cafe_name }}</h3>
          <div class="rating">
            <span v-for="n in 5" :key="n" class="star" :class="{ filled: n <= review.rating }">⭐</span>
          </div>
          <p class="comment">{{ review.comment }}</p>
          <p class="date">{{ formatDate(review.created_at) }}</p>
        </div>
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getUserReviews } from '../../lib/api/reviews'

const reviews = ref([])
const loading = ref(true)

const getImageUrl = (imageUrl) => {
  if (Array.isArray(imageUrl) && imageUrl.length > 0) {
    return imageUrl[0]
  }
  return imageUrl || 'https://via.placeholder.com/200'
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

onMounted(async () => {
  try {
    reviews.value = await getUserReviews()
  } catch (error) {
    console.error('Error loading reviews:', error)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.my-reviews-section {
  padding: 60px 80px;
}

.my-reviews-section h1 {
  font-size: 48px;
  color: #fbe8d3;
  margin-bottom: 50px;
  text-align: left;
}

.loading {
  text-align: center;
  color: #fbe8d3;
  font-size: 20px;
  padding: 100px 0;
}

.no-reviews {
  text-align: center;
  color: #fbe8d3;
  padding: 100px 0;
}

.no-reviews p {
  font-size: 20px;
  margin-bottom: 30px;
}

.browse-btn {
  display: inline-block;
  padding: 15px 40px;
  background-color: #e2b775;
  color: #5c3d2e;
  text-decoration: none;
  border-radius: 10px;
  font-weight: bold;
  transition: all 0.3s;
}

.browse-btn:hover {
  background-color: #d4a95f;
  transform: translateY(-3px);
}

.reviews-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 40px;
}

.review-card {
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  text-decoration: none;
  color: inherit;
}

.review-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
}

.review-card img {
  width: 100%;
  height: 200px;
  object-fit: cover;
}

.review-content {
  padding: 20px;
}

.review-content h3 {
  font-size: 20px;
  color: #fbe8d3;
  margin-bottom: 10px;
}

.rating {
  margin-bottom: 15px;
}

.star {
  opacity: 0.3;
  margin-right: 2px;
}

.star.filled {
  opacity: 1;
}

.comment {
  font-size: 14px;
  color: #e7bf8f;
  margin-bottom: 10px;
  line-height: 1.6;
}

.date {
  font-size: 12px;
  color: #c9a876;
  font-style: italic;
}

@media (max-width: 768px) {
  .my-reviews-section {
    padding: 30px 20px;
  }

  .my-reviews-section h1 {
    font-size: 32px;
  }
}
</style>