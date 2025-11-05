<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import supabase from '../config/supabaseClient'
// console.log(supabase);

const cafes = ref([]);
const selectedCafe = ref('');
const showSuggestions = ref(false);
const crowdLevel = ref(0);
const autocompleteRef = ref(null);
const comments = ref('');
const isSubmitting = ref(false);

// filter cafes based on search input
const filteredCafes = computed(() => {
  if (!selectedCafe.value) return cafes.value;
  return cafes.value.filter(cafe =>
    cafe.cafe_name.toLowerCase().includes(selectedCafe.value.toLowerCase())
  );
});

// close when clicking outside
const handleClickOutside = (event) => {
  if (autocompleteRef.value && !autocompleteRef.value.contains(event.target)) {
    showSuggestions.value = false;
  }
};

onMounted(async () => {
      const { data, error } = await supabase
        .from('cafes')
        .select('id , cafe_name')

      if (error) {
        console.error('Error fetching data:', error);
      } else {
        cafes.value = data;
      }

      // Add click listener to close dropdown when clicking outside
      document.addEventListener('click', handleClickOutside);
    });

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
});

// data for supabase
const selectCafe = (cafeName) => {
  selectedCafe.value = cafeName;
  showSuggestions.value = false;
};

const setCrowdLevel = (level) => {
  crowdLevel.value = level;
};

// insert into supabase

// Submit crowd level data to Supabase
const submitCrowdLevel = async () => {
  // Validate inputs
  if (!selectedCafe.value) {
    alert('Please select a cafe');
    return;
  }
  if (crowdLevel.value === 0) {
    alert('Please select a crowd level');
    return;
  }

  isSubmitting.value = true;

  try {
    // insert into supabase
    const { data, error } = await supabase
      .from('crowd')
      .insert([
        {
          cafe_name: selectedCafe.value,
          crowd_level: crowdLevel.value,
          comments: comments.value || null
        }
      ]);

    if (error) {
      console.error('Error submitting data:', error);
      alert(`Failed to submit crowd level: ${error.message}`);
    } else {
      alert('Crowd level submitted successfully!');
      // reset form
      selectedCafe.value = '';
      crowdLevel.value = 0;
      comments.value = '';
    }
  } catch (err) {
    console.error('Unexpected error:', err);
    alert('An unexpected error occurred. Please try again.');
  } finally {
    isSubmitting.value = false;
  }
};
 
 


</script>

<template>
    <div class="tasksHeading">
        <h1 class="tasksTitle">CROWD LEVEL <br> UPDATE</h1>
    </div>
    <div class="formContainer">
        <div class="crowdForm">
            <div class="autocomplete-container" ref="autocompleteRef">
                <h2>CAFE NAME:</h2>

                <input
                    v-model="selectedCafe"
                    @focus="showSuggestions = true"
                    placeholder="Search cafe..."
                    class="search-bar"
                    type="text"
                /> 
                <ul v-if="showSuggestions && filteredCafes.length" class="suggestions-list">
                    <li
                        v-for="cafe in filteredCafes"
                        :key="cafe.id"
                        @click="selectCafe(cafe.cafe_name)"
                        class="suggestion-item"
                    >
                        {{ cafe.cafe_name }}
                    </li>
                </ul>
            </div>
            <div>
                <h2>CROWD LEVEL</h2>
                <div class="crowd-icons">
                    <span
                        v-for="level in 3"
                        :key="level"
                        @click="setCrowdLevel(level)"
                        :class="['crowd-icon', { filled: level <= crowdLevel }]"
                    >
                        ☕
                    </span>
                </div>
            </div>
            <div>
                <textarea
                    v-model="comments"
                    class="commentsBox"
                    placeholder="Comments"
                ></textarea>
            </div>
            <div>
                <button
                    @click="submitCrowdLevel"
                    :disabled="isSubmitting"
                    class="submit-button"
                >
                    {{ isSubmitting ? 'Submitting...' : 'SUBMIT' }}
                </button>
            </div>
        </div>
    </div>
</template>

<style scoped>
.formContainer {
    padding: 10px;
    display: flex;
    justify-content: center;
    margin: 50px 20px;
}

@media (min-width: 768px) {
    .formContainer {
        margin: 50px 100px;
    }
}

@media (min-width: 1024px) {
    .formContainer {
        margin: 50px 400px;
    }
}

.crowdForm {
    border-radius: 5px;
    background-color: #fdf9ee;
    color: #6d412a;
    padding: 40px 15px;
    margin: 10px;
    width: 100%;
    max-width: 600px;
    text-align: center;
}

@media (min-width: 768px) {
    .crowdForm {
        padding: 60px 20px;
        width: 90%;
    }
}

@media (min-width: 1024px) {
    .crowdForm {
        padding: 90px 5px;
        width: 70%;
    }
}

.autocomplete-container {
    position: relative;
}

.search-bar {
    width: 90%;
    padding: 12px 16px;
    font-size: 16px;
    border: 2px solid #6d412a;
    border-radius: 25px;
    background-color: #fdf9ee;
    color: #6d412a;
    box-sizing: border-box;
    margin: 10px 0;
}

@media (min-width: 768px) {
    .search-bar {
        width: 75%;
    }
}

.search-bar:focus {
    outline: none;
    border-color: #8b5a3c;
}

.search-bar::placeholder {
    color: #a0826d;
}

.suggestions-list {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    margin: 4px 0 0 0;
    padding: 0;
    list-style: none;
    background-color: #fff;
    border: 2px solid #6d412a;
    border-radius: 4px;
    max-height: 200px;
    overflow-y: auto;
    z-index: 1000;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.suggestion-item {
    padding: 10px 12px;
    cursor: pointer;
    color: #6d412a;
    transition: background-color 0.2s;
}

.suggestion-item:hover {
    background-color: #fdf9ee;
}

.crowd-icons {
    display: flex;
    justify-content: center;
    gap: 15px;
    margin-top: 10px;
}

.crowd-icon {
    font-size: 40px;
    cursor: pointer;
    transition: all 0.2s ease;
    opacity: 0.3;
    filter: grayscale(100%);
}

.crowd-icon.filled {
    opacity: 1;
    filter: grayscale(0%);
    transform: scale(1.1);
}

.crowd-icon:hover {
    transform: scale(1.2);
    opacity: 0.7;
}

.commentsBox {
    width: 90%;
    padding: 12px 16px;
    font-size: 16px;
    border: 2px solid #6d412a;
    border-radius: 8px;
    background-color: #fff;
    color: #6d412a;
    box-sizing: border-box;
    margin: 15px 0;
    min-height: 100px;
    resize: none;
    font-family: inherit;
}

@media (min-width: 768px) {
    .commentsBox {
        width: 75%;
    }
}

.commentsBox:focus {
    outline: none;
    border-color: #8b5a3c;
}

.commentsBox::placeholder {
    color: #a0826d;
}

.submit-button {
    width: 90%;
    padding: 14px 28px;
    font-size: 16px;
    font-weight: bold;
    color: #6d412a;
    background-color: #d4a574;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: background-color 0.2s;
    margin-top: 15px;
    box-sizing: border-box;
}

@media (min-width: 768px) {
    .submit-button {
        width: 75%;
        padding: 16px 32px;
        font-size: 18px;
    }
}

.submit-button:hover:not(:disabled) {
    background-color: #c9985a;
}

.submit-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.submitButton {
    color: #6d412a;
    background-color: #e7bf8f;
    border: none;
}

</style>
