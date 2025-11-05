<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import supabase from '../config/supabaseClient'
import { awardPoints } from '../../lib/api/streak'
// console.log(supabase);


const cafes = ref([]);
const selectedCafe = ref('');
const showSuggestions = ref(false);
const crowdLevel = ref(0);
const autocompleteRef = ref(null);
const comments = ref('');
const isSubmitting = ref(false);
const userId = ref(null);


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
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (user) userId.value = user.id

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
    const { error } = await supabase
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
      // Award 5 points for submitting a crowd level update
      await awardPoints(userId.value, 5, 'Submitted a crowd level update')
      alert('Crowd level submitted successfully! You earned 5 points!');
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
                <input
                    v-model="comments"
                    class="commentsBox"
                    type="text"
                    placeholder="Comments"
                />
            </div>
            <div>
                <button
                    @click="submitCrowdLevel"
                    :disabled="isSubmitting"
                    class="submit-button"
                >
                    {{ isSubmitting ? 'Submitting...' : 'Submit' }}
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
    margin: 50px 400px 50px 400px;
}


.crowdForm {
    border-radius: 5px;
    background-color: #fdf9ee;
    color: #6d412a;
    padding: 90px 5px 90px 5px;
    margin: 10px;
    width: 70%;
    text-align: center;
}


.autocomplete-container {
    position: relative;
}


.search-input:focus {
    outline: none;
    border-color: #8b5a3c;
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


.submitButton {
    color: #6d412a;
    background-color: #e7bf8f;
    border: none;
}


</style>



