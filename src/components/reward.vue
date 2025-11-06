<script setup>
import { ref, onMounted, computed } from 'vue';
import supabase from '../config/supabaseClient';

// --- UI state ---
const activeTab = ref('points'); // 'points' | 'myRewards'
const loading = ref(true);
const error = ref(null);

// --- Points ---
const activePoints = ref([]); // only unused points
const totalActivePoints = computed(() => activePoints.value.reduce((s, p) => s + (p.amount || 0), 0));

// --- Rewards available to redeem (static catalog) ---
const rewards = [
  { id: 'coffee20', title: "20% Off Coffee", cost: 2, description: "Get 20% off any coffee in-store." },
  { id: 'coffee1for1', title: "1-for-1 Coffee", cost: 5, description: "Buy one coffee and get another free." },
  { id: 'freecoffee', title: "Free Coffee", cost: 10, description: "Redeem a free drink of your choice." }
];

// --- Redeemed rewards (My Rewards) ---
const myRewards = ref([]); // redeemed_rewards rows where is_used = false

// --- Modal state ---
const showSuccessModal = ref(false);
const successMessage = ref('');
const showRewardDetailModal = ref(false);
const selectedRedeemed = ref(null); // the redeemed_rewards row selected

// --- current user ---
const currentUserId = ref(null);

// --- Fetch helpers ---
const fetchCurrentUserAndData = async () => {
  loading.value = true;
  try {
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    const user = userData?.user ?? null;
    if (!user) {
      error.value = 'Please log in to view your rewards';
      loading.value = false;
      return;
    }

    currentUserId.value = user.id;

    await Promise.all([fetchActivePoints(), fetchMyRewards()]);
  } catch (err) {
    console.error(err);
    error.value = 'Failed to load data';
  } finally {
    loading.value = false;
  }
};

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
      activePoints.value = data || [];
    }
  } catch (err) {
    console.error(err);
    error.value = 'Failed to load points';
  }
};

const fetchMyRewards = async () => {
  try {
    const { data, error: fetchError } = await supabase
      .from('redeemed_rewards')
      .select('*')
      .eq('user_id', currentUserId.value)
      .eq('is_used', false)
      .order('redeemed_at', { ascending: false });

    if (fetchError) {
      console.error('Error fetching redeemed rewards:', fetchError);
    } else {
      myRewards.value = data || [];
    }
  } catch (err) {
    console.error(err);
  }
};

onMounted(() => {
  fetchCurrentUserAndData();
});

// --- UI actions ---
const setTab = (tab) => {
  activeTab.value = tab;
};

// Redeem a reward (called from Points tab)
const redeemReward = async (reward) => {
  if (totalActivePoints.value < reward.cost) {
    successMessage.value = 'Not enough points to redeem this reward.';
    showSuccessModal.value = true;
    return;
  }

  const pointsToUse = [...activePoints.value].sort(
    (a, b) => new Date(a.earned_at) - new Date(b.earned_at)
  );

  let remaining = reward.cost;
  const updatePromises = [];
  const insertPromises = [];

  for (const p of pointsToUse) {
    if (remaining <= 0) break;

    if (p.amount > remaining) {
      const leftover = p.amount - remaining;

      // Mark original row as used
      updatePromises.push(
        supabase.from('points').update({ is_used: true }).eq('id', p.id)
      );

      // Insert leftover as new row
      insertPromises.push(
        supabase.from('points').insert({
          user_id: currentUserId.value,
          amount: leftover,
          is_used: false,
          earned_at: p.earned_at
        })
      );

      remaining = 0;

    } else {
      updatePromises.push(
        supabase.from('points').update({ is_used: true }).eq('id', p.id)
      );

      remaining -= p.amount;
    }
  }
  try {
    // Mark used points
    await Promise.all(updatePromises);

    // Insert into redeemed_rewards table
    await supabase.from('redeemed_rewards').insert({
      user_id: currentUserId.value,
      reward_name: reward.title,
      cost: reward.cost,
      redeemed_at: new Date().toISOString(),
      is_used: false
    });

    // Refresh local data
    await Promise.all([fetchActivePoints(), fetchMyRewards()]);

    // Show success modal and switch to My Rewards
    successMessage.value = 'Reward redeemed! Check it out in My Rewards.';
    showSuccessModal.value = true;
    activeTab.value = 'myRewards';
  } catch (err) {
    console.error('Redeem failed', err);
    successMessage.value = 'Something went wrong while redeeming. Try again.';
    showSuccessModal.value = true;
  }
};

// --- My Rewards actions ---
const openRedeemedDetail = (rewardRow) => {
  selectedRedeemed.value = rewardRow;
  showRewardDetailModal.value = true;
};

const useRedeemedNow = async () => {
  if (!selectedRedeemed.value) return;

  try {
    await supabase
      .from('redeemed_rewards')
      .update({ is_used: true })
      .eq('id', selectedRedeemed.value.id);

    // Refresh
    await fetchMyRewards();
    showRewardDetailModal.value = false;

    successMessage.value = 'Reward used!';
    showSuccessModal.value = true;
  } catch (err) {
    console.error(err);
    successMessage.value = 'Failed to use reward.';
    showSuccessModal.value = true;
  }
};

// Close success modal
const closeSuccessModal = () => {
  showSuccessModal.value = false;
  successMessage.value = '';
};

</script>

<template>
  <div class="rewardsContainer">
    <h1 class="tasksTitle">MY REWARDS</h1>

    <div class="toggleContainer">
      <div class="toggleSlider" :class="{ 'slideRight': activeTab === 'myRewards' }"></div>

      <button @click="setTab('points')" :class="['toggleBtn', { active: activeTab === 'points' }]">Points</button>
      <button @click="setTab('myRewards')" :class="['toggleBtn', { active: activeTab === 'myRewards' }]">My Rewards</button>
    </div>

    <div class="pointsContainer">
      <div v-if="loading" class="loading">Loading your rewards...</div>
      <div v-else-if="error" class="errorMessage">{{ error }}</div>

      <transition name="slide" mode="out-in">
        <!-- POINTS TAB -->
        <div v-if="activeTab === 'points'" key="points">
          <div class="totalPoints">
            <div class="totalLabel">Total Points</div>
            <div class="totalValue">{{ totalActivePoints }}</div>
          </div>

          <h2 class="availableRewardsTitle">Available Rewards</h2>

          <div class="rewardGrid">
            <div v-for="reward in rewards" :key="reward.id" class="rewardCard">
              <div class="rewardInfo">
                <h3>{{ reward.title }}</h3>
                <p class="desc">{{ reward.description }}</p>
              </div>

              <div class="rewardAction">
                <div class="cost">{{ reward.cost }} pts</div>
                <button
                  class="redeemBtn"
                  :disabled="totalActivePoints < reward.cost"
                  @click="redeemReward(reward)"
                >
                  Redeem
                </button>
              </div>
            </div>
          </div>

          <div v-if="rewards.length === 0" class="noPoints">No rewards available.</div>
        </div>

        <!-- MY REWARDS TAB -->
        <div v-else key="myRewards">
          <h2 class="availableRewardsTitle">My Rewards</h2>

          <div v-if="myRewards.length === 0" class="noPoints">You have no redeemed rewards yet.</div>

          <div v-else class="myRewardsGrid">
            <div v-for="rr in myRewards" :key="rr.id" class="myRewardCard" @click="openRedeemedDetail(rr)">
              <div class="mrLeft">
                <h3>{{ rr.reward_name }}</h3>
                <p class="mrDate">Redeemed: {{ new Date(rr.redeemed_at).toLocaleDateString() }}</p>
              </div>
              <div class="mrRight">{{ rr.cost }} pts</div>
            </div>
          </div>
        </div>
      </transition>
    </div>

    <!-- Success Modal (small centered modal) -->
    <div v-if="showSuccessModal" class="modalOverlay" @click.self="closeSuccessModal">
      <div class="modalBox">
        <p>{{ successMessage }}</p>
        <div class="modalActions">
          <button class="modalBtn" @click="closeSuccessModal">OK</button>
        </div>
      </div>
    </div>

    <!-- Reward detail modal for My Rewards -->
    <div v-if="showRewardDetailModal" class="modalOverlay" @click.self="showRewardDetailModal = false">
      <div class="modalBox">
        <h3>{{ selectedRedeemed?.reward_name }}</h3>
        <p class="desc">{{ selectedRedeemed?.description }}</p>
        <p class="mrDate">Redeemed: {{ selectedRedeemed ? new Date(selectedRedeemed.redeemed_at).toLocaleString() : '' }}</p>

        <div class="modalActions">
          <button class="modalBtn secondary" @click="showRewardDetailModal = false">Close</button>
          <button class="modalBtn" @click="useRedeemedNow">Use Now</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Keep your brown/beige theme and polish layout */
.tasksTitle {
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

.toggleBtn.active {
  color: #fdf9ee;
}

.pointsContainer {
  background-color: #fdf9ee;
  border-radius: 8px;
  padding: 20px;
  min-height: 300px;
}

.totalPoints {
  text-align: center;
  color: #6d412a;
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 20px;
  padding: 22px;
  background-color: white;
  border-radius: 8px;
  border: 2px solid #6d412a;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.totalLabel {
  font-size: 14px;
  color: #8b5a3c;
  opacity: 0.85;
}

.totalValue {
  color: #8b5a3c;
  font-size: 40px;
}

.availableRewardsTitle {
  margin-top: 20px;
  color: #6d412a;
}

.rewardGrid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  margin-top: 16px;
}

.rewardCard {
  background: linear-gradient(145deg, #fffdf7, #f3e7d9);
  border: 2px solid #e3c9a8;
  padding: 16px;
  border-radius: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.rewardInfo h3 {
  margin: 0 0 6px 0;
  color: #6d412a;
}

.rewardInfo .desc {
  margin: 0;
  color: #5b3a28;
  font-size: 0.95rem;
}

.rewardAction {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.cost {
  font-weight: 700;
  color: #8b5a3c;
}

.redeemBtn {
  padding: 8px 14px;
  border-radius: 8px;
  border: none;
  background: #6d412a;
  color: #fffdf7;
  font-weight: 600;
  cursor: pointer;
}

.redeemBtn[disabled] {
  opacity: 0.45;
  cursor: not-allowed;
}

/* My Rewards List */
.myRewardsGrid {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 12px;
}

.myRewardCard {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px;
  border-radius: 10px;
  background: white;
  border: 2px solid #e3c9a8;
  cursor: pointer;
}

.myRewardCard h3 {
  margin: 0 0 6px 0;
  color: #6d412a;
}

.mrDate {
  margin: 0;
  color: #8b5a3c;
  font-size: 0.85rem;
}

/* Modal */
.modalOverlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.modalBox {
  width: 90%;
  max-width: 420px;
  background: white;
  padding: 18px;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.2);
  border: 2px solid #e3c9a8;
  text-align: center;
}

.modalActions {
  margin-top: 16px;
  display: flex;
  gap: 8px;
  justify-content: center;
}

.modalBtn {
  padding: 8px 14px;
  border-radius: 10px;
  border: none;
  background: #6d412a;
  color: #fffdf7;
  font-weight: 700;
  cursor: pointer;
}

.modalBtn.secondary {
  background: #f3e7d9;
  color: #6d412a;
  border: 2px solid #e3c9a8;
}

.loading {
  text-align: center;
  color: #6d412a;
  padding: 40px 0;
  font-size: 18px;
  font-weight: 600;
}

.errorMessage {
  text-align: center;
  color: #c74444;
  padding: 40px 20px;
  font-size: 16px;
}

.noPoints {
  text-align: center;
  color: #6d412a;
  padding: 30px 0;
  font-size: 16px;
  opacity: 0.7;
}
</style>
