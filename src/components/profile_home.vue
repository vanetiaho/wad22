<template>
  <div class="home-container">
    <div class="welcome-section">
      <h1>Welcome back, {{ username }}!</h1>
      <p class="tagline">Discover your next favourite study spot</p>
    </div>

    <div class="quick-stats">
      <div class="stat-card">
        <div class="stat-icon">⭐</div>
        <div class="stat-info">
          <h3>{{ reviewCount }}</h3>
          <p>Reviews</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">❤️</div>
        <div class="stat-info">
          <h3>{{ favouriteCount }}</h3>
          <p>Favourites</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🏆</div>
        <div class="stat-info">
          <h3>{{ totalPoints }}</h3>
          <p>Points</p>
        </div>
      </div>
    </div>

    <div class="sections-grid">
      <router-link to="/reviews" class="section-card">
        <div class="card-icon">☕</div>
        <h2>Browse Cafes</h2>
        <p>Explore all available study spots</p>
      </router-link>

      <router-link to="/my-reviews" class="section-card">
        <div class="card-icon">📝</div>
        <h2>My Reviews</h2>
        <p>See all your cafe reviews</p>
      </router-link>

      <router-link to="/favourites" class="section-card">
        <div class="card-icon">❤️</div>
        <h2>Favourites</h2>
        <p>Your saved cafes</p>
      </router-link>

      <router-link to="/map" class="section-card">
        <div class="card-icon">🗺️</div>
        <h2>Find Nearby</h2>
        <p>Discover cafes near you</p>
      </router-link>

      <router-link to="/tasks" class="section-card">
        <div class="card-icon">✅</div>
        <h2>Earn Rewards</h2>
        <p>Complete tasks for points</p>
      </router-link>

      <router-link to="/reward" class="section-card">
        <div class="card-icon">🎁</div>
        <h2>My Rewards</h2>
        <p>View your points balance</p>
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import supabase from '../config/supabaseClient'

const username = ref('User')
const reviewCount = ref(0)
const favouriteCount = ref(0)
const totalPoints = ref(0)

onMounted(async () => {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (user) {
    // Get username
    const { data: profile } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .single()
    
    if (profile) username.value = profile.username

    // Get review count
    const { data: reviews } = await supabase
      .from('reviews')
      .select('review_id', { count: 'exact' })
      .eq('user_id', user.id)
    
    reviewCount.value = reviews?.length || 0

    // Get favourite count
    const { data: favourites } = await supabase
      .from('user_favourites')
      .select('id', { count: 'exact' })
      .eq('user_id', user.id)
    
    favouriteCount.value = favourites?.length || 0

    // Get total points
    const { data: points } = await supabase
      .from('points')
      .select('amount')
      .eq('user_id', user.id)
      .eq('is_used', false)
      .gte('expires_at', new Date().toISOString())
    
    totalPoints.value = points?.reduce((sum, p) => sum + p.amount, 0) || 0
  }
})
</script>

<style scoped>
.home-container {
  padding: 40px 80px;
  max-width: 1400px;
  margin: 0 auto;
}

.welcome-section {
  text-align: center;
  margin-bottom: 50px;
}

.welcome-section h1 {
  font-size: 48px;
  color: #fbe8d3;
  margin-bottom: 10px;
  font-weight: bold;
}

.tagline {
  font-size: 20px;
  color: #e7bf8f;
  opacity: 0.9;
}

.quick-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 50px;
}

.stat-card {
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 15px;
  padding: 25px;
  display: flex;
  align-items: center;
  gap: 20px;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
}

.stat-icon {
  font-size: 40px;
}

.stat-info h3 {
  font-size: 32px;
  color: #fbe8d3;
  margin: 0 0 5px 0;
}

.stat-info p {
  font-size: 14px;
  color: #e7bf8f;
  margin: 0;
}

.sections-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 30px;
}

.section-card {
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 15px;
  padding: 40px 30px;
  text-align: center;
  text-decoration: none;
  color: inherit;
  transition: transform 0.3s ease, box-shadow 0.3s ease, background-color 0.3s ease;
}

.section-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 25px rgba(0, 0, 0, 0.3);
  background-color: rgba(255, 255, 255, 0.08);
}

.card-icon {
  font-size: 60px;
  margin-bottom: 20px;
}

.section-card h2 {
  font-size: 24px;
  color: #fbe8d3;
  margin-bottom: 10px;
}

.section-card p {
  font-size: 14px;
  color: #e7bf8f;
  margin: 0;
}

@media (max-width: 768px) {
  .home-container {
    padding: 20px;
  }

  .welcome-section h1 {
    font-size: 32px;
  }

  .sections-grid {
    grid-template-columns: 1fr;
  }
}
</style>
