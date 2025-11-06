
<template>
  <div class="cafe-review-page">
    <!-- Back Button -->
    <button class="back-btn" @click="$router.back()">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="#000" stroke-width="2" viewBox="0 0 24 24">
        <path d="M15 18l-6-6 6-6"/>
      </svg>
      Back
    </button>

    <!-- Cafe Info -->
    <div class="cafe-header">
      <div class="header-content">
        <div>
          <h1>{{ cafe.cafe_name }}</h1>
          <p>{{ cafe.address }}</p>
          <div class="average-rating">
            Average Rating: 
            <span v-for="n in 5" :key="n" class="star">
              <svg v-if="averageRating >= n" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="#FFD700" viewBox="0 0 24 24">
                <path d="M12 .587l3.668 7.431 8.2 1.192-5.934 5.777 1.4 8.17L12 18.896l-7.334 3.861 1.4-8.17L.132 9.21l8.2-1.192z"/>
              </svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="#FFD700" stroke-width="2" viewBox="0 0 24 24">
                <path d="M12 .587l3.668 7.431 8.2 1.192-5.934 5.777 1.4 8.17L12 18.896l-7.334 3.861 1.4-8.17L.132 9.21l8.2-1.192z"/>
              </svg>
            </span>
            ({{ averageRating.toFixed(1) }})
          </div>
        </div>

        <!-- Heart Favorite Button -->
        <button 
          @click="toggleFavourite"
          class="heart-btn-large"
          :class="{ 'is-favourite': isFavourite }"
        >
          <svg v-if="isFavourite" xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="red" viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="none" stroke="red" stroke-width="2" viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
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
          <button @click="prevImage">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="#000" stroke-width="2" viewBox="0 0 24 24">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </button>
          <button @click="nextImage">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="#000" stroke-width="2" viewBox="0 0 24 24">
              <path d="M9 6l6 6-6 6"/>
            </svg>
          </button>
        </div>
        <button class="add-review-btn" @click="showModal = true">Add Review</button>
      </div>

      <!-- Right side: Reviews -->
      <div class="reviews-list">
        <h2>User Reviews</h2>
        <div v-if="reviews.length === 0" class="no-reviews">No reviews yet. Be the first!</div>
        <div v-for="review in reviews" :key="review.review_id" class="review-card">
          <div class="review-header">
            <span class="review-user">{{ review.name }}</span>
            <span class="review-rating">
              <span v-for="n in 5" :key="n" class="star">
                <svg v-if="review.rating >= n" xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#FFD700" viewBox="0 0 24 24">
                  <path d="M12 .587l3.668 7.431 8.2 1.192-5.934 5.777 1.4 8.17L12 18.896l-7.334 3.861 1.4-8.17L.132 9.21l8.2-1.192z"/>
                </svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="#FFD700" stroke-width="2" viewBox="0 0 24 24">
                  <path d="M12 .587l3.668 7.431 8.2 1.192-5.934 5.777 1.4 8.17L12 18.896l-7.334 3.861 1.4-8.17L.132 9.21l8.2-1.192z"/>
                </svg>
              </span>
            </span>
          </div>
          <p>{{ review.comment }}</p>
        </div>
      </div>
    </div>
  </div>

  <!-- Modal -->
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
          >
            <svg v-if="n <= (hoverRating || newReview.rating)" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="#FFD700" viewBox="0 0 24 24">
              <path d="M12 .587l3.668 7.431 8.2 1.192-5.934 5.777 1.4 8.17L12 18.896l-7.334 3.861 1.4-8.17L.132 9.21l8.2-1.192z"/>
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="#FFD700" stroke-width="2" viewBox="0 0 24 24">
              <path d="M12 .587l3.668 7.431 8.2 1.192-5.934 5.777 1.4 8.17L12 18.896l-7.334 3.861 1.4-8.17L.132 9.21l8.2-1.192z"/>
            </svg>
          </span>
        </div>

        <label>Comment:</label>
        <textarea v-model="newReview.comment" placeholder="Write your review..." required></textarea>

        <button type="submit" :disabled="loading">{{ loading ? 'Submitting...' : 'Submit Review' }}</button>
      </form>

      <button class="close-btn" @click="closeModal">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="#000" stroke-width="2" viewBox="0 0 24 24">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
      </button>
    </div>
  </div>

  <!-- Success Modal -->
  <div v-if="showSuccessModal" class="modalBackdrop"></div>
  <div v-if="showSuccessModal" class="modal">
    <div class="modalTitle">{{ successMessage }}</div>
    <div class="modalActions">
      <button @click="closeSuccessModal" class="btnOk">OK</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import supabase from '../config/supabaseClient'
import { useRoute } from 'vue-router'
import { addFavourite, removeFavourite, checkIfFavourite } from '../../lib/api/favourites'
import { awardPoints } from '../../lib/api/streak'

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

const route = useRoute()
const cafeId = route.params.id

const isFavourite = ref(false)
async function checkFavouriteStatus() {
  try { isFavourite.value = await checkIfFavourite(cafeId) }
  catch (error) { console.error('Error checking favourite status:', error) }
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
  } catch (error) { console.error('Error toggling favourite:', error); alert('Failed to update favourite.') }
}

const cafe = ref({ cafe_name: '', address: '', image_url: [] })
const reviews = ref([])
const averageRating = ref(0)

// Carousel state
const currentIndex = ref(0)
const currentImage = ref('')

async function loadCafe() {
  const { data, error } = await supabase.from('cafes').select('*').eq('id', cafeId).single()
  if (error) console.error('Error loading cafe:', error)
  else {
    cafe.value = data
    if (Array.isArray(cafe.value.image_url) && cafe.value.image_url.length > 0) currentImage.value = cafe.value.image_url[0]
  }
}

async function loadReviews() {
  const { data, error } = await supabase.from('reviews').select('*').eq('cafe_id', cafeId).order('review_id', { ascending: false })
  if (error) console.error('Error loading reviews:', error)
  else {
    reviews.value = data
    if (reviews.value.length > 0) {
      const total = reviews.value.reduce((sum, r) => sum + r.rating, 0)
      averageRating.value = total / reviews.value.length
    }
  }
}

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

onMounted(() => { loadCafe(); loadReviews(); checkFavouriteStatus() })

// Modal logic
const showModal = ref(false)
const loading = ref(false)
const hoverRating = ref(0)
const newReview = ref({ rating: 0, comment: '', cafe_id: cafeId })

// Success modal
const showSuccessModal = ref(false)
const successMessage = ref('')

function setRating(n) { newReview.value.rating = n }
function setHover(n) { hoverRating.value = n }
function resetHover() { hoverRating.value = 0 }
function closeModal() { showModal.value = false }

function closeSuccessModal() {
  showSuccessModal.value = false
  successMessage.value = ''
}

async function submitReview() {
  if (!newReview.value.comment || !newReview.value.rating) {
    successMessage.value = 'Please provide both rating and comment.'
    showSuccessModal.value = true
    return
  }

  loading.value = true
  const { error } = await supabase.from('reviews').insert([{
    cafe_id: cafeId,
    user_id: userId.value,
    name: username.value,
    rating: newReview.value.rating,
    comment: newReview.value.comment,
  }])
  loading.value = false

  if (error) {
    successMessage.value = 'Failed to submit review.'
    showSuccessModal.value = true
  } else {
    // Award 1 points for submitting a review
    await awardPoints(userId.value, 1, 'Submitted a cafe review')
    successMessage.value = 'Review added successfully! You earned 1 points!'
    showSuccessModal.value = true
    closeModal()
    loadReviews()
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

.add-review-btn {
  position: absolute;
  bottom: 20px;
  right: 10px;
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

/* Success Modal Styles */
.modalBackdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 2000;
}

.modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: #fff;
  padding: 15px 20px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  border-radius: 10px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  z-index: 2001;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  width: auto;
  height: auto;
  min-width: 300px;
  max-width: 400px;
}

.modalTitle {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  text-align: center;
  margin-bottom: 15px;
  line-height: 1.5;
  max-width: 350px;
}

.modalActions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.btnOk {
  padding: 12px 40px;
  font-size: 15px;
  font-weight: 600;
  color: #fff;
  background-color: #d4a574;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btnOk:hover {
  background-color: #c9985a;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(212, 165, 116, 0.3);
}
@media (max-width: 900px) {
  .cafe-content {
    flex-direction: column;
  }

  .reviews-list {
    max-height: none;
    margin-top: 20px;
    padding-right: 0;
  }

  .image-carousel {
    max-width: 100%;
  }
}
</style>
