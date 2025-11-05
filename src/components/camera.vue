
<script setup>
import { ref, onBeforeUnmount } from 'vue';
import supabase from '../config/supabaseClient';
import { checkAndAwardStreakPoints } from '../../lib/api/streak';

const videoRef = ref(null);
const canvasRef = ref(null);
const stream = ref(null);
const isCameraActive = ref(false);
const capturedPhoto = ref(null);
const error = ref(null);
const isUploading = ref(false);
const uploadSuccess = ref(null);


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

// clear when component is unmounted
onBeforeUnmount(() => {
  stopCamera();
});
</script>

<template>
  <div class="studyPlannerContainer">
    <div class="tasksHeading">
      <h1 class="tasksTitle">PIC OF <br> THE DAY</h1>
    </div>

    <div class="cameraContainer">
      <div v-if="error" class="errorMessage">
        {{ error }}
      </div>

      <!-- before camera is started -->
      <div v-if="!isCameraActive && !capturedPhoto" class="startScreen">
        <div class="cameraIcon">📷</div>
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
            📸 Take Picture
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
  </div>
</template>

<style scoped>
.studyPlannerContainer {
  max-width: 900px;
  margin: 0 auto;
}

.tasksHeading {
  margin-bottom: 30px;
}

.cameraContainer {
  background-color: #fdf9ee;
  border-radius: 8px;
  padding: 30px;
  min-height: 500px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
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

