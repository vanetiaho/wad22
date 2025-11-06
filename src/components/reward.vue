<script setup>
import { ref, onMounted, computed } from 'vue';
import supabase from '../config/supabaseClient';

const activeTab = ref('points');
const activePoints = ref([]);
const loading = ref(true);
const error = ref(null);
const showInsufficientPopup = ref(false);
const currentUserId = ref(null);
const flippedCard = ref(null);
const selectedReward = ref(null);

const fetchActivePoints = async () => {
  try {
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
      activePoints.value = data;
    }
  } catch (err) {
    console.error('Unexpected error:', err);
    error.value = 'Failed to load active points';
  }
};

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

  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    currentUserId.value = user.id;
    await fetchActivePoints();
  } else {
    error.value = 'Please log in to view your rewards';
  }

  loading.value = false;
});

const rewards = [
  { id: 'coffee20', title: "20% Off Coffee", cost: 20, description: "Get 20% off any coffee in-store." },
  { id: 'coffee1for1', title: "1-for-1 Coffee", cost: 50, description: "Buy one coffee and get another free." },
  { id: 'freecoffee', title: "Free Coffee", cost: 100, description: "Redeem a free drink of your choice." }
];

const flipCard = (rewardId) => {
  if (showInsufficientPopup.value) return;
  flippedCard.value = flippedCard.value === rewardId ? null : rewardId;
};

const handleRedeemClick = (reward) => {
  if (totalActivePoints.value < reward.cost) {
    showInsufficientPopup.value = true;

    setTimeout(() => {
      showInsufficientPopup.value = false;
    }, 1800);

    return;
  }

  selectedReward.value = reward;
  redeemReward();
};

const redeemReward = async () => {
  if (!selectedReward.value) return;

  const reward = selectedReward.value;

  if (totalActivePoints.value < reward.cost) {
    alert("Not enough points to redeem this reward.");
    return;
  }

  const { data: pointRows, error: pointError } = await supabase
    .from("points")
    .select("*")
    .eq("user_id", currentUserId.value)
    .eq("is_used", false)
    .order("earned_at", { ascending: true });

  if (pointError) {
    console.error(pointError);
    return;
  }

  let remaining = reward.cost;
  const updates = [];

  for (const p of pointRows) {
    if (remaining <= 0) break;

    updates.push(
      supabase
        .from("points")
        .update({ is_used: true })
        .eq("id", p.id)
    );

    remaining -= p.amount;
  }

  await Promise.all(updates);

  await supabase.from("redeemed_rewards").insert({
    user_id: currentUserId.value,
    reward_name: reward.title,
    cost: reward.cost,
    redeemed_at: new Date().toISOString()
  });

  await fetchActivePoints();
  alert("Reward redeemed successfully!");
};
</script>

<template>
    <div class="rewardsContainer">
        <h1 class="tasksTitle">MY REWARDS</h1>

        <div class="toggleContainer">
            <div class="toggleSlider" :class="{ 'slideRight': activeTab === 'rewards' }"></div>

                 <button @click="setTab('points')" :class="['toggleBtn', { active: activeTab === 'points' }]">
                    Points
                </button>

                <button @click="setTab('rewards')" :class="['toggleBtn', { active: activeTab === 'rewards' }]">
                    Rewards
                </button>
        </div>

        <div class="pointsContainer">
            <div v-if="loading" class="loading">
                Loading your rewards...
            </div>

            <div v-else-if="error" class="errorMessage">
                {{ error }}
            </div>

            <Transition name="slide" mode="out-in">

                <!-- POINTS TAB -->
                <div v-if="activeTab === 'points'" key="points">
                    <div class="totalPoints">
                        Total Points:
                        <span class="totalValue">{{ totalActivePoints }}</span>
                    </div>

                    <div v-if="activePoints.length === 0" class="noPoints">
                        You have no points yet.
                    </div>

                    <div v-else class="pointsList">
                        <div v-for="point in activePoints" :key="point.id" class="pointCard">
                            <div class="pointInfo">
                                <h3>{{ point.reason || 'Reward Points' }}</h3>
                                <p class="pointDate">Earned: {{ formatDate(point.earned_at) }}</p>
                            </div>
                            <div class="pointValue">+{{ point.amount }}</div>
                        </div>
                    </div>
                </div>

               <!-- REWARDS TAB -->
                <div v-else key="rewards">
                    <h2 class="availableRewardsTitle">Available Rewards</h2>

                    <div class="rewardGrid">
                        <div
                            v-for="reward in rewards"
                            :key="reward.id"
                            class="flipCard"
                            :class="{ flipped: flippedCard === reward.id }"
                            @click="flipCard(reward.id)"
                            >

                            <!-- Front side -->
                                <div class="flipCardFront">
                                    <h3>{{ reward.title }}</h3>
                                    <p>{{ reward.cost }} points</p>
                                </div>

                            <!-- Back side -->
                                <div class="flipCardBack">
                                    <h3>{{ reward.title }}</h3>
                                    <p class="desc">{{ reward.description }}</p>
                                    <p class="costTag">{{ reward.cost }} points</p>

                                    <button
                                        class="redeemBtn"
                                        @click.stop.prevent="handleRedeemClick(reward)"
                                         :disabled="totalActivePoints < reward.cost"
                                        >
                                        Redeem Now
                                    </button>
      
                                </div>
                        </div>
                    </div>
                     <div v-if="showInsufficientPopup" class="insufficientPopup">
                        Insufficient points
                    </div>
                </div>
            </Transition>
           

        </div>
    </div>
</template>

<style scoped>
h1 {
  color: #fbe8d3;
  margin: 30px 0;
  text-align: center;    
  font-weight: 700;     
}

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

.rewardGrid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
  margin-top: 30px;
}

.flipCard {
  width: 100%;
  height: 240px;
  perspective: 1000px;
  cursor: pointer;
  position: relative;
}

.flipCardFront,
.flipCardBack {
  width: 100%;
  height: 100%;
  border-radius: 14px;
  backface-visibility: hidden;
  position: absolute;
  top: 0;
  left: 0;
  transition: transform 0.7s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 8px rgba(0,0,0,0.08);
}

/* Front of card (clean, minimal) */
.flipCardFront {
  background: linear-gradient(145deg, #fffdf7, #f3e7d9);
  border: 2px solid #e3c9a8;
}

.flipCardFront h3 {
  font-size: 1.2rem;
  color: #6d412a;
  margin-bottom: 8px;
}

.flipCardFront p {
  color: #8b5a3c;
  font-weight: bold;
}

/* Back of card (info + buttons) */
.flipCardBack {
  background: linear-gradient(160deg, #fffaf3, #f0e4d0);
  border: 2px solid #e0c59c;
  padding: 20px;
  transform: rotateY(180deg);
  text-align: center;
}

.flipCard.flipped .flipCardFront {
  transform: rotateY(180deg);
}

.flipCard.flipped .flipCardBack {
  transform: rotateY(360deg);
}

.flipCardBack h3 {
  font-size: 1.1rem;
  color: #6d412a;
  margin-bottom: 6px;
}

.flipCardBack .desc {
  font-size: 0.95rem;
  line-height: 1.3;
  opacity: 0.85;
  color: #5b3a28;
  margin: 6px 0 10px;
  padding: 0 8px;
}

.flipCardBack .costTag {
  font-weight: bold;
  color: #8b5a3c;
  margin-bottom: 10px;
}

/* Buttons */
.redeemBtn {
  margin-top: 8px;
  padding: 8px 16px;
  border-radius: 8px;
  border: none;
  background: #6d412a;
  color: #fffdf7;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s ease, background 0.2s ease;
}

.redeemBtn:hover {
  background: #8b5a3c;
  transform: translateY(-2px);
}
@media (max-width: 600px) {
  .flipCard {
    height: 280px;
  }

  .flipCardBack .desc {
    font-size: 0.85rem;
  }

  .redeemBtn {
    font-size: 0.9rem;
    padding: 8px 12px;
  }
}

.insufficientPopup {
  position: fixed;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  background: #c74444;
  color: white;
  padding: 12px 18px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  z-index: 9999;
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
  animation: fadeInOut 1.8s ease forwards;
}

@keyframes fadeInOut {
  0% { opacity: 0; transform: translateX(-50%) translateY(10px); }
  15% { opacity: 1; transform: translateX(-50%) translateY(0); }
  85% { opacity: 1; }
  100% { opacity: 0; transform: translateX(-50%) translateY(10px); }
}


</style>
