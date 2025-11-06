<script setup>
import { ref, computed, onMounted } from 'vue';
import supabase from '../config/supabaseClient';
import { getUserStreak } from '../../lib/api/streak';

const currentDate = ref(new Date());
const photosData = ref({}); // { 'YYYY-MM-DD': [{ url, timestamp }] }
const loading = ref(true);
const selectedDate = ref(null);
const showModal = ref(false);
const currentStreak = ref(0);

// Get current user
const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  return { user, error };
};

// Fetch all photos from Supabase storage for current user
const fetchPhotos = async () => {
  try {
    loading.value = true;
    const { user, error: authError } = await getCurrentUser();

    if (authError || !user) {
      console.error('User not authenticated');
      loading.value = false;
      return;
    }

    // List all files in user's folder
    const { data, error: listError } = await supabase.storage
      .from('photos')
      .list(user.id);

    if (listError) {
      console.error('Error fetching photos:', listError);
      loading.value = false;
      return;
    }

    photosData.value = {};

    // Process each photo
    if (data && data.length > 0) {
      for (const file of data) {
        // Extract timestamp from filename (format: {timestamp}.png)
        const timestamp = parseInt(file.name.split('.')[0]);
        if (!isNaN(timestamp)) {
          const photoDate = new Date(timestamp);
          const dateKey = formatDateKey(photoDate);

          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from('photos')
            .getPublicUrl(`${user.id}/${file.name}`);

          // Group photos by date
          if (!photosData.value[dateKey]) {
            photosData.value[dateKey] = [];
          }
          photosData.value[dateKey].push({
            url: publicUrl,
            timestamp: photoDate
          });
        }
      }
    }

    // Fetch current streak
    const streak = await getUserStreak(user.id);
    currentStreak.value = streak;

    loading.value = false;
  } catch (err) {
    console.error('Unexpected error fetching photos:', err);
    loading.value = false;
  }
};

// Format date as YYYY-MM-DD for grouping
const formatDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Get calendar grid for current month
const calendarDays = computed(() => {
  const year = currentDate.value.getFullYear();
  const month = currentDate.value.getMonth();

  // First day of month and number of days
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const days = [];

  // Add empty slots for days before month starts
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }

  // Add all days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day);
  }

  return days;
});

// Check if a date has photos
const hasPhotos = (day) => {
  if (!day) return false;
  const year = currentDate.value.getFullYear();
  const month = String(currentDate.value.getMonth() + 1).padStart(2, '0');
  const dateKey = `${year}-${month}-${String(day).padStart(2, '0')}`;
  return photosData.value[dateKey] && photosData.value[dateKey].length > 0;
};

// Get photos for a specific date
const getPhotosForDate = (day) => {
  if (!day) return [];
  const year = currentDate.value.getFullYear();
  const month = String(currentDate.value.getMonth() + 1).padStart(2, '0');
  const dateKey = `${year}-${month}-${String(day).padStart(2, '0')}`;
  return photosData.value[dateKey] || [];
};

// Navigate to previous month
const previousMonth = () => {
  currentDate.value = new Date(
    currentDate.value.getFullYear(),
    currentDate.value.getMonth() - 1,
    1
  );
};

// Navigate to next month
const nextMonth = () => {
  currentDate.value = new Date(
    currentDate.value.getFullYear(),
    currentDate.value.getMonth() + 1,
    1
  );
};

// Open modal for a date
const openPhotosModal = (day) => {
  if (hasPhotos(day)) {
    selectedDate.value = day;
    showModal.value = true;
  }
};

// Close modal
const closeModal = () => {
  showModal.value = false;
  selectedDate.value = null;
};

// Format month and year header
const monthYearHeader = computed(() => {
  return currentDate.value.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  });
});

onMounted(() => {
  fetchPhotos();
});
</script>

<template>

  <div class="calendarContainer">
    <div class="tasksHeading">
      <h1 class="tasksTitle">STUDY<br> STREAK</h1>
    </div>

    <div class="calendarWrapper">
      <!-- Streak indicator -->
      <div class="streakIndicator" v-if="currentStreak > 0">
        <span class="streakFire">🔥</span>
        <span class="streakCount">{{ currentStreak }} day streak!</span>
      </div>

      <!-- Header with month navigation -->
      <div class="calendarHeader">
        <button @click="previousMonth" class="navBtn">← Previous</button>
        <h2 class="monthYear">{{ monthYearHeader }}</h2>
        <button @click="nextMonth" class="navBtn">Next →</button>
      </div>

      <!-- Loading state -->
      <div v-if="loading" class="loadingState">
        <div class="spinner"></div>
        <p>Loading your photos...</p>
      </div>

      <!-- Calendar grid -->
      <div v-else class="calendarGrid">
        <!-- Day headers -->
        <div class="dayHeader">Sun</div>
        <div class="dayHeader">Mon</div>
        <div class="dayHeader">Tue</div>
        <div class="dayHeader">Wed</div>
        <div class="dayHeader">Thu</div>
        <div class="dayHeader">Fri</div>
        <div class="dayHeader">Sat</div>

        <!-- Calendar days -->
        <div
          v-for="(day, index) in calendarDays"
          :key="index"
          class="dayCell"
          :class="{
            'empty': !day,
            'hasPhotos': day && hasPhotos(day)
          }"
          @click="day && openPhotosModal(day)"
        >
          <div v-if="day && hasPhotos(day)" class="photoThumbnail">
            <img
              :src="getPhotosForDate(day)[0].url"
              :alt="`Photo on day ${day}`"
            />
          </div>
          <div v-if="day" class="dayNumber">{{ day }}</div>
        </div>
      </div>

      <!-- No photos message -->
      <div v-if="!loading && Object.keys(photosData).length === 0" class="noPhotosMessage">
        <p>📸 No pictures yet. Start taking photos with the camera!</p>
      </div>
    </div>

    <!-- Photo modal -->
    <div v-if="showModal" class="modalOverlay" @click="closeModal">
      <div class="modalContent" @click.stop>
        <div class="modalHeader">
          <h3>Photos from {{ monthYearHeader.split(' ')[0] }} {{ selectedDate }}</h3>
          <button @click="closeModal" class="closeBtn">✕</button>
        </div>

        <div class="photosGrid">
          <div
            v-for="(photo, idx) in getPhotosForDate(selectedDate)"
            :key="idx"
            class="photoThumbnail"
          >
            <img :src="photo.url" :alt="`Photo ${idx + 1}`" />
            <div class="photoTime">
              {{ photo.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.calendarContainer {
  padding: 20px;
  max-width: 900px;
  margin: 0 auto;
}

.tasksHeading {
  margin-bottom: 10px;
  margin-top: 10px;
  padding-top: 10px;
}

.tasksTitle {
  font-size: 32px;
  font-weight: 700;
  color: #fbe8d3;
  line-height: 1.2;
  margin: 0;
}

.calendarWrapper {
  background-color: #fdf9ee;
  border-radius: 8px;
  padding: 30px;
  min-height: 500px;
}

.streakIndicator {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 20px;
  padding: 15px 20px;
  background: linear-gradient(135deg, #ffeaa7 0%, #fdcb6e 100%);
  border-radius: 8px;
  border: 2px solid #f39c12;
}

.streakFire {
  font-size: 24px;
  animation: flicker 0.6s infinite alternate;
}

@keyframes flicker {
  0%, 18%, 22%, 25%, 54%, 56%, 100% {
    opacity: 1;
  }
  20%, 24%, 55% {
    opacity: 0.7;
  }
}

.streakCount {
  font-size: 18px;
  font-weight: 700;
  color: #6d412a;
}

.calendarHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  gap: 20px;
}

.navBtn {
  padding: 10px 20px;
  background-color: #6d412a;
  color: #fdf9ee;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.navBtn:hover {
  background-color: #8b5a3c;
  transform: scale(1.05);
}

.monthYear {
  font-size: 24px;
  font-weight: 700;
  color: #6d412a;
  margin: 0;
  min-width: 200px;
  text-align: center;
}

.loadingState {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
  padding: 60px 20px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e7bf8f;
  border-top-color: #6d412a;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.calendarGrid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 10px;
}

.dayHeader {
  font-weight: 700;
  color: #6d412a;
  text-align: center;
  padding: 10px 0;
  font-size: 12px;
}

.dayCell {
  aspect-ratio: 1;
  border: 2px solid #e7bf8f;
  border-radius: 8px;
  padding: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  background-color: white;
  position: relative;
  min-height: 70px;
  overflow: hidden;
}

.dayCell.empty {
  background-color: transparent;
  border: none;
}

.dayCell.hasPhotos {
  border-color: #6d412a;
  background-color: #f5eee3;
  cursor: pointer;
  transition: all 0.3s ease;
  padding: 0;
}

.dayCell.hasPhotos:hover {
  transform: scale(1.05);
}

.dayNumber {
  font-size: 14px;
  font-weight: 600;
  color: #6d412a;
  position: absolute;
  top: 5px;
  left: 5px;
  background-color: rgba(255, 255, 255, 0.9);
  padding: 2px 6px;
  border-radius: 4px;
  z-index: 10;
}

.photoThumbnail {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  border-radius: 6px;
  overflow: hidden;
}

.photoThumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.noPhotosMessage {
  text-align: center;
  padding: 40px 20px;
  color: #999;
  font-size: 16px;
}

/* Modal styles */
.modalOverlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modalContent {
  background-color: #fdf9ee;
  border-radius: 12px;
  padding: 30px;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
  width: 100%;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
}

.modalHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  border-bottom: 2px solid #e7bf8f;
  padding-bottom: 15px;
}

.modalHeader h3 {
  margin: 0;
  color: #6d412a;
  font-size: 18px;
}

.closeBtn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #6d412a;
  transition: transform 0.2s ease;
}

.closeBtn:hover {
  transform: scale(1.2);
}

.photosGrid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 15px;
}

.photoThumbnail {
  position: relative;
  overflow: hidden;
  border-radius: 8px;
  aspect-ratio: 1;
  background-color: #e7bf8f;
}

.photoThumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.photoTime {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 5px;
  font-size: 12px;
  text-align: center;
}

/* Responsive design */
/* Tablet and smaller screens */
@media (max-width: 768px) {
  .calendarContainer {
    padding: 15px;
  }

  .calendarWrapper {
    padding: 20px;
    min-height: auto;
  }

  .tasksTitle {
    font-size: 24px;
  }

  .streakIndicator {
    padding: 12px 15px;
    margin-bottom: 15px;
    gap: 8px;
  }

  .streakFire {
    font-size: 20px;
  }

  .streakCount {
    font-size: 16px;
  }

  .calendarHeader {
    flex-direction: column;
    margin-bottom: 20px;
    gap: 10px;
  }

  .navBtn {
    width: 100%;
    padding: 10px 15px;
    font-size: 13px;
  }

  .monthYear {
    min-width: auto;
    width: 100%;
    font-size: 20px;
  }

  .calendarGrid {
    gap: 8px;
  }

  .dayCell {
    min-height: 60px;
    padding: 5px;
  }

  .dayNumber {
    font-size: 12px;
  }

  .photosGrid {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 10px;
  }

  .modalContent {
    padding: 20px;
    max-width: 90vw;
  }

  .modalHeader h3 {
    font-size: 16px;
  }

  .closeBtn {
    font-size: 20px;
  }
}

/* Small mobile screens */
@media (max-width: 480px) {
  .calendarContainer {
    padding: 10px;
  }

  .calendarWrapper {
    padding: 15px;
  }

  .tasksTitle {
    font-size: 20px;
    font-weight: 700;
  }

  .streakIndicator {
    padding: 10px 12px;
    margin-bottom: 12px;
    gap: 6px;
  }

  .streakFire {
    font-size: 18px;
  }

  .streakCount {
    font-size: 14px;
  }

  .calendarHeader {
    gap: 8px;
  }

  .navBtn {
    padding: 8px 12px;
    font-size: 12px;
  }

  .monthYear {
    font-size: 18px;
  }

  .dayHeader {
    font-size: 10px;
    padding: 5px 0;
  }

  .calendarGrid {
    gap: 6px;
  }

  .dayCell {
    min-height: 50px;
    padding: 4px;
  }

  .dayNumber {
    font-size: 11px;
    padding: 1px 4px;
  }

  .photoIndicator {
    font-size: 16px;
  }

  .noPhotosMessage {
    padding: 30px 15px;
    font-size: 14px;
  }

  .photosGrid {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 8px;
  }

  .modalOverlay {
    padding: 10px;
  }

  .modalContent {
    padding: 15px;
    border-radius: 8px;
  }

  .modalHeader {
    margin-bottom: 15px;
    padding-bottom: 12px;
  }

  .modalHeader h3 {
    font-size: 14px;
  }

  .closeBtn {
    font-size: 18px;
  }

  .photoTime {
    font-size: 10px;
    padding: 4px;
  }
}

/* Extra small mobile screens */
@media (max-width: 380px) {
  .calendarContainer {
    padding: 8px;
  }

  .calendarWrapper {
    padding: 10px;
    min-height: auto;
  }

  .tasksTitle {
    font-size: 18px;
  }

  .streakIndicator {
    padding: 8px 10px;
    margin-bottom: 10px;
    gap: 5px;
  }

  .streakFire {
    font-size: 16px;
  }

  .streakCount {
    font-size: 12px;
  }

  .calendarHeader {
    gap: 5px;
  }

  .navBtn {
    padding: 6px 10px;
    font-size: 11px;
  }

  .monthYear {
    font-size: 16px;
  }

  .dayHeader {
    font-size: 9px;
    padding: 3px 0;
  }

  .calendarGrid {
    gap: 4px;
  }

  .dayCell {
    min-height: 45px;
    padding: 3px;
    border: 1.5px solid #e7bf8f;
  }

  .dayNumber {
    font-size: 10px;
    padding: 1px 3px;
  }

  .photoIndicator {
    font-size: 14px;
  }

  .noPhotosMessage {
    padding: 20px 10px;
    font-size: 13px;
  }

  .photosGrid {
    grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
    gap: 6px;
  }

  .modalOverlay {
    padding: 5px;
  }

  .modalContent {
    padding: 12px;
    border-radius: 6px;
    max-width: 95vw;
  }

  .modalHeader {
    margin-bottom: 10px;
    padding-bottom: 10px;
    gap: 5px;
  }

  .modalHeader h3 {
    font-size: 12px;
  }

  .closeBtn {
    font-size: 16px;
  }

  .photoTime {
    font-size: 9px;
    padding: 2px;
  }
}
</style>
