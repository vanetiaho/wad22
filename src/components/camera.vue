
<script setup>
import { ref, onBeforeUnmount, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import supabase from '../config/supabaseClient';
import { checkAndAwardStreakPoints, getUserStreak } from '../../lib/api/streak';

const router = useRouter();

const videoRef = ref(null);
const canvasRef = ref(null);
const stream = ref(null);
const isCameraActive = ref(false);
const capturedPhoto = ref(null);
const error = ref(null);
const isUploading = ref(false);
const uploadSuccess = ref(null);
const currentStreak = ref(0);


const startCamera = async () => {
  try {
    error.value = null;

    // request access to the camera, camera dimensions
    const mediaStream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: 'environment'
      }
    });

    stream.value = mediaStream;
    isCameraActive.value = true;

    // make sure videoRef is available
    await new Promise(resolve => setTimeout(resolve, 100));

    // attach stream to the video element
    if (videoRef.value) {
      videoRef.value.srcObject = mediaStream;
      await videoRef.value.play();
    }
  } catch (err) {
    console.error('Error accessing camera:', err);
    error.value = `Unable to access camera: ${err.message}. Please make sure you have granted camera permissions.`;
    isCameraActive.value = false;
  }
};

// stop camera
const stopCamera = () => {
  if (stream.value) {
    stream.value.getTracks().forEach(track => track.stop());
    stream.value = null;
  }
  if (videoRef.value) {
    videoRef.value.srcObject = null;
  }
  isCameraActive.value = false;
};

// take picture
const takePicture = () => {
  if (!videoRef.value || !canvasRef.value) return;

  const video = videoRef.value;
  const canvas = canvasRef.value;

  // match canvas dimensions to video
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  // put current video frame into canvas & invert
  const context = canvas.getContext('2d');
  context.save();
  context.scale(-1, 1);
  context.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
  context.restore();

  // convert canvas to data url
  capturedPhoto.value = canvas.toDataURL('image/png');

  // stop camera after pic taken
  stopCamera();
};

// retake pic
const retakePhoto = () => {
  capturedPhoto.value = null;
  startCamera();
};

// download pic
const downloadPhoto = () => {
  if (!capturedPhoto.value) return;

  const link = document.createElement('a');
  link.href = capturedPhoto.value;
  link.download = `map&mag-${Date.now()}.png`;
  link.click();
};

// upload to supabase
const uploadPhoto = async () => {
  if (!capturedPhoto.value) return;

  isUploading.value = true;
  error.value = null;
  uploadSuccess.value = null;

  try {
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      error.value = 'Please log in to upload photos';
      isUploading.value = false;
      return;
    }

    // Convert dataURL to Blob
    const response = await fetch(capturedPhoto.value);
    const blob = await response.blob();

    // Create unique filename
    const fileName = `${user.id}/${Date.now()}.png`;

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from('photos')
      .upload(fileName, blob, {
        contentType: 'image/png',
        upsert: false
      });

    if (uploadError) {
      error.value = `Upload failed: ${uploadError.message}`;
      isUploading.value = false;
      return;
    }

    // Get public URL
    supabase.storage
      .from('photos')
      .getPublicUrl(fileName);

    // Check streak and award points if milestone reached
    const streakResult = await checkAndAwardStreakPoints(user.id);

    let successMessage = 'Photo uploaded successfully!';
    if (streakResult.milestone) {
      successMessage += ` 🎉 Streak milestone: ${streakResult.streak} days! Earned 5 points!`;
    }

    uploadSuccess.value = successMessage;
    isUploading.value = false;

    // Reset after 2 seconds
    setTimeout(() => {
      capturedPhoto.value = null;
      uploadSuccess.value = null;
    }, 2000);

  } catch (err) {
    console.error('Upload error:', err);
    error.value = `Unexpected error: ${err.message}`;
    isUploading.value = false;
  }
};

// Get current user
const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  return { user, error };
};

// Fetch current streak
const fetchStreak = async () => {
  try {
    const { user, error: authError } = await getCurrentUser();
    if (authError || !user) {
      console.error('User not authenticated');
      return;
    }
    const streak = await getUserStreak(user.id);
    currentStreak.value = streak;
  } catch (err) {
    console.error('Error fetching streak:', err);
  }
};

// clear when component is unmounted
onBeforeUnmount(() => {
  stopCamera();
});

// Navigate to calendar
const goToCalendar = () => {
  router.push('/calendar');
};

// Fetch streak on mount
onMounted(() => {
  fetchStreak();
});
</script>

<template>
  <div class="quizContainer">
    <div class="tasksHeading">
      <h1 class="pageTitle">STUDY STREAKS</h1>
    </div>

    <div class="cameraContainer">
      <div v-if="error" class="errorMessage">
        {{ error }}
      </div>

      <!-- before camera is started -->
     <div v-if="!isCameraActive && !capturedPhoto" class="startScreen">
        <div class="cameraIcon">
          <svg width="100" height="100" viewBox="0 0 72 72" xmlns="http://www.w3.org/2000/svg"><path fill="#3f3f3f" d="M33.853 28.007c-5.286 0-9.585 4.299-9.585 9.584s4.3 9.584 9.584 9.584 9.585-4.3 9.585-9.584-4.3-9.584-9.584-9.584m0 14.584c-2.758 0-5-2.243-5-5s2.242-5 5-5 5 2.242 5 5-2.243 5-5 5"/><circle cx="33.852" cy="37.591" r="5" fill="#d0cfce"/><path fill="#fff" d="M57.93 22.918H15.27c-1.182 0-3.144 1.924-3.144 3.062l.456 7.218h8.047l4.15.188c-.013.022 3.276-5.795 9.073-5.795 4.15 0 8.744 5.01 8.74 5l3.391.299 14.304.23-.213-7.14c0-1.138-.962-3.062-2.143-3.062"/><path fill="#f1b31c" d="M28.818 19.184c-.017.26-1.35-2.163-1.35-2.163h-9.035s-1.282 2.504-1.306 2.438v3.33l11.691-.119z"/><path fill="#9b9b9a" d="M56.973 52.518c.132-.003 3.101-1.79 3.101-1.924l.213-17.474-10.778-.226-2.383-.697h-3.69l.014.035c.22.391-.665.797-.494 1.215.011.028.296 7.996.155 8.144-.426.445-2.263 3.21-3.06 3.844-2.386 1.903-4.585 2.03-4.672 2.039-.346.033-1.999.113-2.114.099-.11-.014-2.34-.383-4.202-1.394-1.78-.966-3.199-2.575-3.21-2.588-.553-.635-.988-1.976-1-2-.12-.229-1.03-2.126-.84-4.782.081-1.152 1.347-4.5 1.347-4.5l-4.731-.112c.18 0-8.909.394-8.909.394l.103 16.61s.5 1.407 1.224 2.166a4.36 4.36 0 0 0 1.944 1.151z"/><g/><g/><g/><g fill="none" stroke="#000" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10" stroke-width="2"><path d="M15.27 22.918c-1.737 0-3.144 1.37-3.144 3.062v23.221c0 1.692 1.407 3.063 3.144 3.063h41.66c1.737 0 3.144-1.371 3.144-3.063V25.98c0-1.691-1.407-3.062-3.144-3.062zm31.882 10.279h12.466m-47.036 0h8.047"/><circle cx="33.852" cy="37.591" r="10"/><circle cx="33.852" cy="37.591" r="5"/><path d="M27.831 19.12v-1.078c0-.564-.47-1.021-1.048-1.021h-7.677c-.578 0-1.048.457-1.048 1.02v1.079"/></g></svg>
        </div>
        <button @click="startCamera" class="actionBtn primaryBtn">
          start camera !
        </button>
      </div>

      <!-- shows video preview after camera starts but havent take pic -->
      <div v-if="isCameraActive && !capturedPhoto" class="cameraView">
        <video
          ref="videoRef"
          autoplay
          playsinline
          muted
          class="videoPreview"
        ></video>

        <div class="cameraControls">
          <button @click="takePicture" class="actionBtn captureBtn">
             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24" style="vertical-align: middle; margin-right: 5px;">
            <path d="M20 5h-3.586l-1.707-1.707A.996.996 0 0 0 14 3h-4c-.267 0-.519.105-.707.293L7.586 5H4c-1.103 0-2 .897-2 2v12c0 1.103.897 2 2 2h16c1.103 0 2-.897 2-2V7c0-1.103-.897-2-2-2zm-8 14c-3.309 0-6-2.691-6-6s2.691-6 6-6 6 2.691 6 6-2.691 6-6 6zm0-10a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"/>
          </svg>
            Take Picture
          </button>
          <button @click="stopCamera" class="actionBtn stopBtn">
            ✕ Close Camera
          </button>
        </div>
      </div>

      <!-- shows pic after taken -->
      <div v-if="capturedPhoto" class="photoPreview">
        <img :src="capturedPhoto" alt="Captured photo" class="capturedImage" />

        <div v-if="uploadSuccess" class="successMessage">
          {{ uploadSuccess }}
        </div>

        <div class="photoControls">
          <button
            @click="uploadPhoto"
            class="actionBtn primaryBtn"
            :disabled="isUploading"
          >
            {{ isUploading ? '⏳ Uploading...' : '☁ Upload to Cloud' }}
          </button>
          <button @click="downloadPhoto" class="actionBtn primaryBtn">
            ⬇ Download
          </button>
          <button
            @click="retakePhoto"
            class="actionBtn secondaryBtn"
            :disabled="isUploading"
          >
            🔄 Retake
          </button>
        </div>
      </div>

      <!-- hide canvas -->
      <canvas ref="canvasRef" style="display: none;"></canvas>
    </div>

    <!-- Streak indicator -->
    <div class="streakIndicator" v-if="currentStreak > 0" @click="goToCalendar">
      <span class="streakFire"><svg width="30" height="30" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" class="iconify iconify--noto"><radialGradient id="a" cx="68.884" cy="124.296" r="70.587" gradientTransform="rotate(-179.751 65.907 -39.816)scale(1 -1.64082)" gradientUnits="userSpaceOnUse"><stop offset=".314" stop-color="#ff9800"/><stop offset=".662" stop-color="#ff6d00"/><stop offset=".972" stop-color="#f44336"/></radialGradient><path d="M35.56 40.73c-.57 6.08-.97 16.84 2.62 21.42 0 0-1.69-11.82 13.46-26.65 6.1-5.97 7.51-14.09 5.38-20.18-1.21-3.45-3.42-6.3-5.34-8.29-1.12-1.17-.26-3.1 1.37-3.03 9.86.44 25.84 3.18 32.63 20.22 2.98 7.48 3.2 15.21 1.78 23.07-.9 5.02-4.1 16.18 3.2 17.55 5.21.98 7.73-3.16 8.86-6.14.47-1.24 2.1-1.55 2.98-.56 8.8 10.01 9.55 21.8 7.73 31.95-3.52 19.62-23.39 33.9-43.13 33.9-24.66 0-44.29-14.11-49.38-39.65-2.05-10.31-1.01-30.71 14.89-45.11 1.18-1.08 3.11-.12 2.95 1.5" fill="url(#a)"/><radialGradient id="b" cx="64.921" cy="54.062" r="73.86" gradientTransform="rotate(90.579 18.654 7.312)scale(1 -.7525)" gradientUnits="userSpaceOnUse"><stop offset=".214" stop-color="#fff176"/><stop offset=".328" stop-color="#fff27d"/><stop offset=".487" stop-color="#fff48f"/><stop offset=".672" stop-color="#fff7ad"/><stop offset=".793" stop-color="#fff9c4"/><stop offset=".822" stop-color="#fff8bd" stop-opacity=".804"/><stop offset=".863" stop-color="#fff6ab" stop-opacity=".529"/><stop offset=".91" stop-color="#fff38d" stop-opacity=".209"/><stop offset=".941" stop-color="#fff176" stop-opacity="0"/></radialGradient><path d="M76.11 77.42c-9.09-11.7-5.02-25.05-2.79-30.37.3-.7-.5-1.36-1.13-.93-3.91 2.66-11.92 8.92-15.65 17.73-5.05 11.91-4.69 17.74-1.7 24.86 1.8 4.29-.29 5.2-1.34 5.36-1.02.16-1.96-.52-2.71-1.23a16.1 16.1 0 0 1-4.44-7.6c-.16-.62-.97-.79-1.34-.28-2.8 3.87-4.25 10.08-4.32 14.47C40.47 113 51.68 124 65.24 124c17.09 0 29.54-18.9 19.72-34.7-2.85-4.6-5.53-7.61-8.85-11.88" fill="url(#b)"/></svg></span>
      <span class="streakCount">{{ currentStreak }} day streak!</span>
    </div>
  </div>
</template>

<style scoped>
h1 {
  color: #fbe8d3;
  text-align: center;    
  font-weight: 700;     
}

.quizContainer {
  max-width: 900px;
  width: 100%;
  margin: 0 auto;
}

.tasksHeading {
  margin-bottom: 30px;
}

.streakIndicator {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin: 0 auto 30px auto;
  padding: 15px 20px;
  background: linear-gradient(135deg, #F0EDEE 0%, #fbe8d3 100%);
  border-radius: 8px;
  border: 2px solid #6D412A;
  width: fit-content;
  cursor: pointer;
  transition: all 0.3s ease;
}

.streakIndicator:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
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

.cameraContainer {
  background-color: #fdf9ee;
  border-radius: 8px;
  padding: 30px;
  margin-bottom: 50px;
  min-height: 500px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin: 40px;
}

.errorMessage {
  background-color: #ffe5e5;
  color: #c74444;
  padding: 15px 20px;
  border-radius: 8px;
  border: 2px solid #c74444;
  margin-bottom: 20px;
  text-align: center;
}

.startScreen {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 30px;
}

.cameraIcon {
  font-size: 80px;
}

.actionBtn {
  padding: 15px 40px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 180px;
}

.primaryBtn {
  background-color: #6d412a;
  color: #fdf9ee;
}

.primaryBtn:hover {
  background-color: #8b5a3c;
  transform: scale(1.05);
}

.stopBtn {
  background-color: #e7bf8f;
  color: #6d412a;
}

.stopBtn:hover {
  background-color: #d4ad7b;
  transform: scale(1.05);
}

.captureBtn {
  color: #6d412a;
  font-size: 18px;
}

.captureBtn:hover {
  background-color: #6d412a;
  color: #fdf9ee;
  transform: scale(1.05);
}

.cameraView {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
  align-items: center;
}

.videoPreview {
  width: 100%;
  max-width: 640px;
  border-radius: 8px;
  border: 3px solid #6d412a;
  background-color: black;
  transform: scaleX(-1);
}

.cameraControls {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
  justify-content: center;
}

.photoPreview {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
  align-items: center;
}

.capturedImage {
  width: 100%;
  max-width: 640px;
  border-radius: 8px;
  border: 3px solid #6d412a;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.successMessage {
  background-color: #d4edda;
  color: #155724;
  padding: 15px 20px;
  border-radius: 8px;
  border: 2px solid #28a745;
  text-align: center;
  font-weight: 600;
  margin-bottom: 20px;
}

.photoControls {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
  justify-content: center;
}

.actionBtn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>

