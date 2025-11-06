<template>
  <div class="myReviewsSection">
    <h1 class="pageTitle">MY REVIEWS</h1>

    <div v-if="loading" class="loading">Loading your reviews...</div>

    <div v-else-if="reviews.length === 0" class="noReviews">
      <p>You haven't reviewed any cafes yet.</p>
      <router-link to="/reviews" class="browseBtn">Browse Cafes</router-link>
    </div>

    <div v-else class="reviewsGrid">
      <router-link
        v-for="review in reviews"
        :key="review.id"
        :to="`/cafe_review/${review.cafe_id}`"
        class="reviewCard"
      >
        <img
          :src="getImageUrl(review.cafes?.image_url)"
          :alt="review.cafes?.cafe_name"
        />
        <div class="reviewContent">
          <h3>{{ review.cafes?.cafe_name }}</h3>
          <div class="rating">
            <span v-for="n in 5" :key="n" class="star">
              <svg v-if="n <= review.rating" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#FFD700" viewBox="0 0 24 24">
                <path d="M12 .587l3.668 7.431 8.2 1.192-5.934 5.777 1.4 8.17L12 18.896l-7.334 3.861 1.4-8.17L.132 9.21l8.2-1.192z"/>
              </svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="#FFD700" stroke-width="2" viewBox="0 0 24 24">
                <path d="M12 .587l3.668 7.431 8.2 1.192-5.934 5.777 1.4 8.17L12 18.896l-7.334 3.861 1.4-8.17L.132 9.21l8.2-1.192z"/>
              </svg>
            </span>
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
  if (!dateString) return 'No date'
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return 'Invalid date'
  return date.toLocaleDateString('en-US', {
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
.myReviewsSection {
  padding: 60px 80px;
}

.pageTitle {
  margin-bottom: 30px;
}

.loading {
  text-align: center;
  color: #fbe8d3;
  font-size: 20px;
  padding: 100px 0;
}

.noReviews {
  text-align: center;
  color: #fbe8d3;
  padding: 100px 0;
}

.noReviews p {
  font-size: 20px;
  margin-bottom: 30px;
}

.browseBtn {
  display: inline-block;
  padding: 15px 40px;
  background-color: #e2b775;
  color: #5c3d2e;
  text-decoration: none;
  border-radius: 10px;
  font-weight: bold;
  transition: all 0.3s;
}

.browseBtn:hover {
  background-color: #d4a95f;
  transform: translateY(-3px);
}

.reviewsGrid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 40px;
}

.reviewCard {
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  text-decoration: none;
  color: inherit;
}

.reviewCard:hover {
  transform: translateY(-8px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
}

.reviewCard img {
  width: 100%;
  height: 200px;
  object-fit: cover;
}

.reviewContent {
  padding: 20px;
}

.reviewContent h3 {
  font-size: 20px;
  color: #fbe8d3;
  margin-bottom: 10px;
}

.rating {
  margin-bottom: 15px;
}

.star {
  display: inline-block;
  margin-right: 2px;
}

.star svg {
  display: block;
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
  .myReviewsSection {
    padding: 30px 20px;
  }

  .myReviewsSection h1 {
    font-size: 32px;
  }
}
</style>