<script setup>
import { ref, onMounted, computed } from 'vue';
import supabase from '../config/supabaseClient';

const activeTab = ref('active');
const activePoints = ref([]);
const expiredPoints = ref([]);
const loading = ref(true);
const error = ref(null);

// Get current user (you'll need to implement authentication)
// For now, using a placeholder - replace with your actual auth logic
const currentUserId = ref(null);

// fetch active points
const fetchActivePoints = async () => {
  try {
    const now = new Date().toISOString();

    // Fetch all non-used points for the user
    const { data, error: fetchError } = await supabase
      .from('points')
      .select('*')
      .eq('user_id', currentUserId.value)
      .eq('is_used', false)
      .order('earned_at', { ascending: false });

    if (fetchError) {
      console.error('Error fetching active points:', fetchError);
      error.value = fetchError.message;
    } else {
      // Filter in JavaScript - show points that haven't expired or have no expiration
      activePoints.value = data.filter(p => !p.expires_at || p.expires_at >= now);
    }
  } catch (err) {
    console.error('Unexpected error:', err);
    error.value = 'Failed to load active points';
  }
};

// fetch expired points
const fetchExpiredPoints = async () => {
  try {
    const now = new Date().toISOString();

    // Fetch all points for the user
    const { data, error: fetchError } = await supabase
      .from('points')
      .select('*')
      .eq('user_id', currentUserId.value)
      .order('expires_at', { ascending: false });

    if (fetchError) {
      console.error('Error fetching expired points:', fetchError);
      error.value = fetchError.message;
    } else {
      // Filter in JavaScript - show only expired points (expires_at exists and is in the past)
      expiredPoints.value = data.filter(p => p.expires_at && p.expires_at < now);
    }
  } catch (err) {
    console.error('Unexpected error:', err);
    error.value = 'Failed to load expired points';
  }
};

// total active points
const totalActivePoints = computed(() => {
  return activePoints.value.reduce((sum, point) => sum + point.amount, 0);
});


const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const setTab = (tab) => {
  activeTab.value = tab;
};

onMounted(async () => {
  loading.value = true;

  // Get current user from Supabase auth
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    currentUserId.value = user.id;
    await Promise.all([fetchActivePoints(), fetchExpiredPoints()]);
  } else {
    error.value = 'Please log in to view your rewards';
  }

  loading.value = false;
});
</script>

<template>
    <div class="rewardsContainer">
        <h1 class="tasksTitle">MY REWARDS</h1>

        <div class="toggleContainer">
            <div class="toggleSlider" :class="{ 'slideRight': activeTab === 'expired' }"></div>
            <button
                @click="setTab('active')"
                :class="['toggleBtn', { active: activeTab === 'active' }]"
            >
                Active
            </button>
            <button
                @click="setTab('expired')"
                :class="['toggleBtn', { active: activeTab === 'expired' }]"
            >
                Expired
            </button>
        </div>

        <div class="pointsContainer">
            <div v-if="loading" class="loading">
                Loading your rewards...
            </div>

            <div v-else-if="error" class="errorMessage">
                {{ error }}
            </div>

            <Transition v-else name="slide" mode="out-in">
                <div v-if="activeTab === 'active'" key="active">
                    <div class="totalPoints">
                        Total Active Points: <span class="totalValue">{{ totalActivePoints }}</span>
                    </div>
                    <div v-if="activePoints.length === 0" class="noPoints">
                        No active points
                    </div>
                    <div v-else class="pointsList">
                        <div v-for="point in activePoints" :key="point.id" class="pointCard">
                            <div class="pointInfo">
                                <h3>{{ point.reason || 'Reward Points' }}</h3>
                                <p class="pointDate">Earned: {{ formatDate(point.earned_at) }}</p>
                                <p class="pointDate">Expires: {{ formatDate(point.expires_at) }}</p>
                            </div>
                            <div class="pointValue">+{{ point.amount }}</div>
                        </div>
                    </div>
                </div>

                <div v-else key="expired">
                    <div v-if="expiredPoints.length === 0" class="noPoints">
                        No expired points
                    </div>
                    <div v-else class="pointsList">
                        <div v-for="point in expiredPoints" :key="point.id" class="pointCard expired">
                            <div class="pointInfo">
                                <h3>{{ point.reason || 'Reward Points' }}</h3>
                                <p class="pointDate">Earned: {{ formatDate(point.earned_at) }}</p>
                                <p class="pointDate">Expired: {{ formatDate(point.expires_at) }}</p>
                                <p v-if="point.is_used" class="pointUsed">(Used)</p>
                            </div>
                            <div class="pointValue expiredValue">{{ point.amount }}</div>
                        </div>
                    </div>
                </div>
            </Transition>
        </div>
    </div>
</template>

<style scoped>
.rewardsContainer {
    padding-top: 50px;
    padding-bottom: 50px;
    max-width: 900px;
    margin: 0 auto;
}

.toggleContainer {
    position: relative;
    display: flex;
    justify-content: center;
    gap: 0;
    margin-top: 20px;
    margin-bottom: 30px;
    border: 2px solid #6d412a;
    border-radius: 8px;
    overflow: hidden;
    width: fit-content;
    margin-left: auto;
    margin-right: auto;
    background-color: #fdf9ee;
}

.toggleSlider {
    position: absolute;
    top: 0;
    left: 0;
    width: 50%;
    height: 100%;
    background-color: #6d412a;
    transition: transform 0.3s ease;
    z-index: 0;
}

.toggleSlider.slideRight {
    transform: translateX(100%);
}

.toggleBtn {
    position: relative;
    padding: 12px 40px;
    background-color: transparent;
    color: #6d412a;
    border: none;
    cursor: pointer;
    font-size: 16px;
    font-weight: 600;
    transition: color 0.3s ease;
    z-index: 1;
}

.toggleBtn:first-child {
    border-right: 2px solid #6d412a;
}

.toggleBtn.active {
    color: #fdf9ee;
}

.toggleBtn:hover {
    opacity: 0.8;
}

.pointsContainer {
    background-color: #fdf9ee;
    border-radius: 8px;
    padding: 20px;
    min-height: 500px;
}

.loading {
    text-align: center;
    color: #6d412a;
    padding: 50px 0;
    font-size: 18px;
    font-weight: 600;
}

.errorMessage {
    text-align: center;
    color: #c74444;
    padding: 50px 20px;
    font-size: 16px;
}

.totalPoints {
    text-align: center;
    color: #6d412a;
    font-size: 24px;
    font-weight: bold;
    margin-bottom: 20px;
    padding: 15px;
    background-color: white;
    border-radius: 8px;
    border: 2px solid #6d412a;
}

.totalValue {
    color: #8b5a3c;
    font-size: 28px;
}

.noPoints {
    text-align: center;
    color: #6d412a;
    padding: 50px 0;
    font-size: 18px;
    opacity: 0.6;
}

.pointsList {
    display: flex;
    flex-direction: column;
    gap: 15px;
}

.pointCard {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: white;
    padding: 20px;
    border-radius: 8px;
    border: 2px solid #6d412a;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.pointCard:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.pointCard.expired {
    opacity: 0.6;
    border-color: #999;
}

.pointInfo h3 {
    color: #6d412a;
    margin: 0 0 8px 0;
    font-size: 18px;
}

.pointDate {
    color: #8b5a3c;
    margin: 2px 0;
    font-size: 14px;
}

.pointUsed {
    color: #c74444;
    margin: 5px 0 0 0;
    font-size: 14px;
    font-weight: 600;
}

.pointValue {
    font-size: 32px;
    font-weight: bold;
    color: #6d412a;
}

.pointValue.expiredValue {
    color: #999;
}

/* slideover transition */
.slide-enter-active,
.slide-leave-active {
    transition: all 0.3s ease;
}

.slide-enter-from {
    transform: translateX(30px);
    opacity: 0;
}

.slide-leave-to {
    transform: translateX(-30px);
    opacity: 0;
}
</style>