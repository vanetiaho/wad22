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
const showSuccessModal = ref(false);
const successMessage = ref('');


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
    successMessage.value = 'Please select a cafe';
    showSuccessModal.value = true;
    return;
  }
  if (crowdLevel.value === 0) {
    successMessage.value = 'Please select a crowd level';
    showSuccessModal.value = true;
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
      successMessage.value = `Failed to submit crowd level: ${error.message}`;
      showSuccessModal.value = true;
    } else {
      // Award 5 points for submitting a crowd level update
      await awardPoints(userId.value, 5, 'Submitted a crowd level update')
      successMessage.value = 'Crowd level submitted successfully! You earned 5 points!';
      showSuccessModal.value = true;
      // reset form
      selectedCafe.value = '';
      crowdLevel.value = 0;
      comments.value = '';
    }
  } catch (err) {
    console.error('Unexpected error:', err);
    successMessage.value = 'An unexpected error occurred. Please try again.';
    showSuccessModal.value = true;
  } finally {
    isSubmitting.value = false;
  }
};

const closeModal = () => {
  showSuccessModal.value = false;
  successMessage.value = '';
};

</script>
<template>
    <div class="tasksHeading">
        <h1 class="pageTitle">CROWD LEVEL <br> UPDATE</h1>
    </div>
    <div class="formContainer">
        <div class="crowdForm">
            <div class="autocompleteContainer" ref="autocompleteRef">
                <h2>CAFE NAME:</h2>


                <input
                    v-model="selectedCafe"
                    @focus="showSuggestions = true"
                    placeholder="Search cafe..."
                    class="searchBar"
                />
                <ul v-if="showSuggestions && filteredCafes.length" class="suggestionsList">
                    <li
                        v-for="cafe in filteredCafes"
                        :key="cafe.id"
                        @click="selectCafe(cafe.cafe_name)"
                        class="suggestionItem"
                    >
                        {{ cafe.cafe_name }}
                    </li>
                </ul>
            </div>
            <div>
                <h2>CROWD LEVEL</h2>
                <div class="crowdIcons">
                    <div
                        v-for="level in 3"
                        :key="level"
                        @click="setCrowdLevel(level)"
                        :class="['crowdIcon', { filled: level <= crowdLevel }]"
                    >
                        <svg width="50" height="50" viewBox="0 0 47.5 47.5" xml:space="preserve" xmlns="http://www.w3.org/2000/svg"><defs><clipPath clipPathUnits="userSpaceOnUse" id="a"><path d="M0 38h38V0H0z"/></clipPath><clipPath clipPathUnits="userSpaceOnUse" id="b"><path d="M0 38h38V0H0z"/></clipPath></defs><g clip-path="url(#a)" transform="matrix(1.25 0 0 -1.25 0 47.5)"><path d="M0 0c0-5.522-8.059-10-18-10S-36-5.522-36 0s8.059 10 18 10S0 5.522 0 0" style="fill:#99aab5;fill-opacity:1;fill-rule:nonzero;stroke:none" transform="translate(37 11)"/><path d="M0 0c0-5.522-8.059-10-18-10S-36-5.522-36 0s8.059 10 18 10S0 5.522 0 0" style="fill:#ccd6dd;fill-opacity:1;fill-rule:nonzero;stroke:none" transform="translate(37 13)"/><path d="M0 0c-14.958 0-17 15-17 19h34c0-2-1.958-19-17-19" style="fill:#f5f8fa;fill-opacity:1;fill-rule:nonzero;stroke:none" transform="translate(19 6)"/><path d="M0 0c-1.357.938-3.103 1.694-5.121 2.25C-3.246 2.826-.57 2.559 0 0m2.503-2.692C4.945 7.43-7.278 5.014-9.701 3.106c-1.34.149-2.736.234-4.181.234-9.389 0-17-3.228-17-8.444s7.611-9.444 17-9.444 17 4.228 17 9.444c0 .862-.225 1.664-.615 2.412" style="fill:#ccd6dd;fill-opacity:1;fill-rule:nonzero;stroke:none" transform="translate(32.882 30.048)"/></g><g clip-path="url(#b)" transform="matrix(1.25 0 0 -1.25 0 47.5)"><path d="M0 0c0-3.866-6.716-7-15-7s-15 3.134-15 7 6.716 7 15 7S0 3.866 0 0" style="fill:#8a4b38;fill-opacity:1;fill-rule:nonzero;stroke:none" transform="translate(34 24)"/><path d="M0 0a1 1 0 0 0-.707.293C-3.044 2.63-3.083 5.178-.832 8.555c.739 1.109.9 2.245.478 3.377-.461 1.235-1.438 1.996-1.731 2.076-.553 0-.958.444-.958.996 0 .553.491.996 1.043.996.997 0 2.395-1.153 3.183-2.625 1.034-1.933.91-4.039-.351-5.93C-1.129 4.503-.699 3.113.707 1.707A.999.999 0 0 0 0 0" style="fill:#d99e82;fill-opacity:1;fill-rule:nonzero;stroke:none" transform="translate(21 20)"/><path d="M0 0a1 1 0 0 0-.707.293C-3.044 2.63-3.083 5.178-.832 8.555c.727 1.091.894 2.082.494 2.947-.444.961-1.431 1.469-1.684 1.499a.99.99 0 0 0-.989.999c0 .553.459 1 1.011 1 .997 0 2.584-.974 3.36-2.423.481-.899 1.053-2.761-.528-5.132C-1.129 4.503-.699 3.113.707 1.707A.999.999 0 0 0 0 0" style="fill:#d99e82;fill-opacity:1;fill-rule:nonzero;stroke:none" transform="translate(15 22)"/></g></svg>
                    </div>
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
                    class="submitButton"
                >
                    {{ isSubmitting ? 'Submitting...' : 'Submit' }}
                </button>
            </div>
        </div>
    </div>

    <!-- Success Modal -->
    <div v-if="showSuccessModal" class="modalBackdrop"></div>
    <div v-if="showSuccessModal" class="modal">
        <div class="modalTitle">{{ successMessage }}</div>
        <div class="modalActions">
            <button @click="closeModal" class="btnOk">OK</button>
        </div>
    </div>
</template>


<style scoped>
.formContainer {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 40px 20px 60px 20px;
    min-height: auto;
}

.crowdForm {
    background-color: #fdf9ee;
    color: #6d412a;
    border-radius: 12px;
    padding: 50px 40px;
    width: 100%;
    max-width: 500px;
    text-align: center;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.crowdForm h2 {
    margin: 0 0 15px 0;
    font-size: 16px;
    font-weight: 600;
    letter-spacing: 1px;
    text-align: left;
    padding: 0 10px;
}

.crowdForm > div {
    margin-bottom: 20px;
    text-align: center;
}

.autocompleteContainer {
    position: relative;
    text-align: left;
}

.searchBar {
    width: 100%;
    padding: 14px 18px;
    font-size: 15px;
    border: 2px solid #6d412a;
    border-radius: 25px;
    background-color: #fff;
    color: #6d412a;
    box-sizing: border-box;
    transition: all 0.2s ease;
}

.searchBar:focus {
    outline: none;
    border-color: #8b5a3c;
    background-color: #fdf9ee;
}

.searchBar::placeholder {
    color: #a0826d;
}

.suggestionsList {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    margin: 6px 0 0 0;
    padding: 0;
    list-style: none;
    background-color: #fff;
    border: 2px solid #6d412a;
    border-radius: 8px;
    max-height: 220px;
    overflow-y: auto;
    z-index: 1000;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.suggestionItem {
    padding: 12px 18px;
    cursor: pointer;
    color: #6d412a;
    transition: background-color 0.2s;
    border-bottom: 1px solid #f0e6d2;
}

.suggestionItem:last-child {
    border-bottom: none;
}

.suggestionItem:hover {
    background-color: #f9f2e4;
}

.crowdIcons {
    display: flex;
    justify-content: center;
    gap: 25px;
    margin-top: 15px;
    margin-bottom: 10px;
}

.crowdIcon {
    cursor: pointer;
    transition: all 0.2s ease;
    opacity: 0.3;
    filter: grayscale(100%);
    user-select: none;
    display: flex;
    align-items: center;
    justify-content: center;
}

.crowdIcon svg {
    width: 50px;
    height: 50px;
}

.crowdIcon:hover {
    transform: scale(1.15);
    opacity: 0.6;
}

.crowdIcon.filled {
    opacity: 1;
    filter: grayscale(0%);
    transform: scale(1.2);
}

.commentsBox {
    width: 100%;
    padding: 14px 18px;
    font-size: 15px;
    border: 2px solid #6d412a;
    border-radius: 8px;
    background-color: #fff;
    color: #6d412a;
    box-sizing: border-box;
    font-family: inherit;
    transition: all 0.2s ease;
}

.commentsBox:focus {
    outline: none;
    border-color: #8b5a3c;
    background-color: #fdf9ee;
}

.commentsBox::placeholder {
    color: #a0826d;
}

.submitButton {
    width: 100%;
    padding: 16px 32px;
    font-size: 16px;
    font-weight: 600;
    letter-spacing: 1px;
    color: #fff;
    background-color: #d4a574;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    box-sizing: border-box;
}

.submitButton:hover:not(:disabled) {
    background-color: #c9985a;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(212, 165, 116, 0.3);
}

.submitButton:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

/* Responsive design */
@media (max-width: 768px) {
    .crowdForm {
        padding: 40px 25px;
        max-width: 100%;
        border-radius: 8px;
    }

    .crowdForm h2 {
        font-size: 14px;
    }

    .searchBar,
    .commentsBox {
        padding: 12px 16px;
        font-size: 14px;
    }

    .crowdIcons {
        gap: 20px;
    }

    .crowdIcon {
        font-size: 45px;
    }

    .submitButton {
        padding: 14px 24px;
        font-size: 15px;
    }
}

@media (max-width: 480px) {
    .formContainer {
        padding: 20px 15px;
    }

    .crowdForm {
        padding: 30px 20px;
    }

    .crowdForm h2 {
        font-size: 13px;
    }

    .crowdForm > div {
        margin-bottom: 15px;
    }

    .searchBar,
    .commentsBox {
        padding: 11px 14px;
        font-size: 13px;
        border-radius: 6px;
    }

    .crowdIcons {
        gap: 15px;
        margin-top: 12px;
    }

    .crowdIcon {
        font-size: 40px;
    }

    .submitButton {
        padding: 12px 20px;
        font-size: 14px;
    }
}

/* Modal Styles */
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


</style>



