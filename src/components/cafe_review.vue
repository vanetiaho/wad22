<template>
  <div class="cafe-review-page">
    <button class="back-btn" @click="$router.back()">← Back</button>
    <!-- Cafe Info -->
    <div class="cafe-header">
      <div class="header-content">
        <div>
          <h1>{{ cafe.cafe_name }}</h1>
          <p>{{ cafe.address }}</p>
          <div class="average-rating">
            Average Rating: 
            <span v-for="n in 5" :key="n" class="star" :class="{ filled: n <= Math.round(averageRating) }">⭐</span>
            ({{ averageRating.toFixed(1) }})
          </div>
        </div>

        <!-- Heart Button -->
        <button 
          @click="toggleFavourite"
          class="heart-btn-large"
          :class="{ 'is-favourite': isFavourite }"
        >
          {{ isFavourite ? '❤️' : '🤍' }}
        </button>
      </div>
    </div>

    <div class="cafe-content">
      <!-- Left side: Carousel of images -->
      <div class="image-carousel">
        <div class="carousel-wrapper">
          <img :src="currentImage" :alt="cafe.cafe_name" />
        </div>
        <div class="carousel-controls">
          <button @click="prevImage">‹</button>
          <button @click="nextImage">›</button>
        </div>
      </div>

      <!-- Right side: Reviews -->
      <div class="reviews-list">
        <h2>User Reviews</h2>
        <div v-if="reviews.length === 0" class="no-reviews">No reviews yet. Be the first!</div>
        <div v-for="review in reviews" :key="review.review_id" class="review-card">
          <div class="review-header">
            <span class="review-user">{{ review.name }}</span>
            <span class="review-rating">
              <span v-for="n in 5" :key="n" class="star" :class="{ filled: n <= review.rating }">⭐</span>
            </span>
          </div>
          <p>{{ review.comment }}</p>
        </div>
      </div>
    </div>

    <!-- Floating add review button -->
    <!-- <router-link :to="`/add_review?cafe_id=${cafe.id}`" class="add-review-btn">+</router-link> -->
    <button class="add-review-btn" @click="showModal = true">Add Review</button>
  </div>
  <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
    <div class="modal-content">
      <h2>Add a Review for {{ cafe.cafe_name }}</h2>

      <form @submit.prevent="submitReview">
        <label>Your Rating:</label>
        <div class="stars">
          <span 
            v-for="n in 5" 
            :key="n"
            @click="setRating(n)"
            @mouseover="setHover(n)"
            @mouseleave="resetHover"
            :class="{ selected: n <= (hoverRating || newReview.rating) }"
          >⭐</span>
        </div>

        <label>Comment:</label>
        <textarea v-model="newReview.comment" placeholder="Write your review..." required></textarea>

        <button type="submit" :disabled="loading">{{ loading ? 'Submitting...' : 'Submit Review' }}</button>
      </form>

      <button class="close-btn" @click="closeModal">✖</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import supabase from '../config/supabaseClient'
import { useRoute } from 'vue-router'
import { addFavourite, removeFavourite, checkIfFavourite } from '../../lib/api/favourites'

const userId = ref(null)
const username = ref('')

onMounted(async () => {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (user) {
    userId.value = user.id
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .single()
    
    if (profile) username.value = profile.username
  }
})



const isFavourite = ref(false)

async function checkFavouriteStatus() {
  try {
    isFavourite.value = await checkIfFavourite(cafeId)
  } catch (error) {
    console.error('Error checking favourite status:', error)
  }
}

async function toggleFavourite() {
  try {
    if (isFavourite.value) {
      await removeFavourite(cafeId)
      isFavourite.value = false
    } else {
      await addFavourite(cafeId)
      isFavourite.value = true
    }
  } catch (error) {
    console.error('Error toggling favourite:', error)
    alert('Failed to update favourite. Please try again.')
  }
}

const route = useRoute()
const cafeId = route.params.id
console.log('Route params:', route.params)


const cafe = ref({
  cafe_name: '',
  address: '',
  image_url: []
})
const reviews = ref([])
const averageRating = ref(0)

// Carousel state
const currentIndex = ref(0)
const currentImage = ref('')

// Load cafe data
async function loadCafe() {
  const { data, error } = await supabase
    .from('cafes')
    .select('*')
    .eq('id', cafeId)
    .single()
  if (error) {
    console.error('Error loading cafe:', error)
  } else {
    console.log('Cafe loaded:', data)
    cafe.value = data
    if (Array.isArray(cafe.value.image_url) && cafe.value.image_url.length > 0) {
      currentImage.value = cafe.value.image_url[0]
    }
  }
}

// Load reviews for this cafe
async function loadReviews() {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('cafe_id', cafeId)
    .order('review_id', { ascending: false })
  if (error) {
    console.error('Error loading reviews:', error)
  } else {
    reviews.value = data
    if (reviews.value.length > 0) {
      const total = reviews.value.reduce((sum, r) => sum + r.rating, 0)
      averageRating.value = total / reviews.value.length
    }
  }
}


// Carousel controls
function nextImage() {
  if (Array.isArray(cafe.value.image_url) && cafe.value.image_url.length > 0) {
    currentIndex.value = (currentIndex.value + 1) % cafe.value.image_url.length
    currentImage.value = cafe.value.image_url[currentIndex.value]
  }
}
function prevImage() {
  if (Array.isArray(cafe.value.image_url) && cafe.value.image_url.length > 0) {
    currentIndex.value = (currentIndex.value - 1 + cafe.value.image_url.length) % cafe.value.image_url.length
    currentImage.value = cafe.value.image_url[currentIndex.value]
  }
}

onMounted(() => {
  loadCafe()
  loadReviews()
  checkFavouriteStatus()
})


// --- Modal logic ---
const showModal = ref(false)
const loading = ref(false)
const hoverRating = ref(0)
const newReview = ref({
  rating: 0,
  comment: '',
  cafe_id: cafeId, // auto-linked to the current cafe
})

function setRating(n) {
  newReview.value.rating = n
}
function setHover(n) {
  hoverRating.value = n
}
function resetHover() {
  hoverRating.value = 0
}

function closeModal() {
  showModal.value = false
}

async function submitReview() {
  if (!newReview.value.comment || !newReview.value.rating) {
    alert('Please provide both a rating and comment.')
    return
  }

  loading.value = true
  const { error } = await supabase
    .from('reviews')
    .insert([
      {
        cafe_id: cafeId,
        user_id: userId.value,
        name : username.value,
        rating: newReview.value.rating,
        comment: newReview.value.comment,
      },
    ])

  loading.value = false

  if (error) {
    console.error('Error adding review:', error)
    alert('Failed to submit review.')
  } else {
    alert('Review added successfully!')
    closeModal()
    loadReviews() // reload updated reviews
  }
}
</script>

<style scoped>
.cafe-review-page {
  padding: 20px 40px;
  color: #fbe8d3;
}

.cafe-header {
  margin-bottom: 20px;
}

.cafe-header h1 {
  font-size: 28px;
  margin-bottom: 5px;
}

.cafe-header p {
  font-size: 16px;
  margin-bottom: 5px;
}

.average-rating .star {
  opacity: 0.4;
  margin-right: 2px;
}

.average-rating .star.filled {
  opacity: 1;
}

.cafe-content {
  display: flex;
  gap: 30px;
}

/* Carousel */
.image-carousel {
  flex: 1;
  position: relative;
  max-width: 400px;
}

.carousel-wrapper {
  width: 100%;
  height: 300px;
  overflow: hidden;
  border-radius: 12px;
}

.carousel-wrapper img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.carousel-controls {
  display: flex;
  justify-content: space-between;
  margin-top: 5px;
}

.carousel-controls button {
  background-color: rgba(255,255,255,0.1);
  border: none;
  color: #fbe8d3;
  padding: 5px 12px;
  border-radius: 6px;
  cursor: pointer;
}

/* Reviews */
.reviews-list {
  flex: 1;
  max-height: 500px;
  overflow-y: auto;
  padding-right: 10px;
}

.review-card {
  background-color: rgba(255,255,255,0.05);
  border-radius: 10px;
  padding: 12px 15px;
  margin-bottom: 12px;
}

.review-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
}

.review-user {
  font-weight: bold;
}

.review-rating .star {
  opacity: 0.4;
  margin-right: 2px;
}

.review-rating .star.filled {
  opacity: 1;
}

/* Floating add review button */
.add-review-btn {
  position: fixed;
  bottom: 25px;
  right: 25px;
  background-color: #fbe8d3;
  color: #333;
  font-size: 15px;
  border-radius: 15px;
  width: 100px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
}

.back-btn {
  background: none;
  border: none;
  color: #fbe8d3;
  font-size: 20px;
  cursor: pointer;
  margin-bottom: 10px;
  transition: opacity 0.2s;
}
.back-btn:hover {
  opacity: 0.7;
}

.modal-overlay {
  position: fixed;
  top: 0; left: 0;
  width: 100vw; height: 100vh;
  background: rgba(0,0,0,0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.modal-content {
  background: #2b2b2b;
  padding: 30px;
  border-radius: 12px;
  width: 90%;
  max-width: 400px;
  position: relative;
  color: #fbe8d3;
}

.close-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  background: none;
  border: none;
  color: #fbe8d3;
  font-size: 18px;
  cursor: pointer;
}

.stars span {
  cursor: pointer;
  opacity: 0.4;
  margin-right: 5px;
  transition: transform 0.2s, opacity 0.2s;
}
.stars span.selected {
  opacity: 1;
  transform: scale(1.2);
}


/* Heart Button */
.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.heart-btn-large {
  background-color: rgba(255, 255, 255, 0.9);
  border: none;
  border-radius: 50%;
  width: 60px;
  height: 60px;
  font-size: 32px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  flex-shrink: 0;
}

.heart-btn-large:hover {
  transform: scale(1.15);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.heart-btn-large.is-favourite {
  background-color: rgba(255, 200, 200, 0.95);
}
</style>