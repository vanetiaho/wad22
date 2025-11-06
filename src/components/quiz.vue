<script setup>
import { ref, nextTick, onMounted } from 'vue';
import { Groq } from "groq-sdk";
import * as pdfjsLib from 'pdfjs-dist';
import * as mammoth from 'mammoth';
import JSZip from 'jszip';
import supabase from '../config/supabaseClient';
import { awardPoints } from '../../lib/api/streak';

// Initialize Groq client
const groq = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
  dangerouslyAllowBrowser: true // Required for client-side usage
});
const model = "meta-llama/llama-4-scout-17b-16e-instruct";

// Set up PDF.js worker - use the bundled worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).href;

// Component state
const chatHistory = ref([]);
const isLoading = ref(false);
const error = ref(null);
const uploadedFile = ref(null);
const fileContent = ref('');
const isQuizMode = ref(false);
const currentQuestion = ref(null);
const quizScore = ref({ correct: 0, total: 0 });
const previousQuestions = ref([]); // Track previous questions to avoid repetition
const TOTAL_QUESTIONS = 5; // Limit to 5 questions
const chatContainer = ref(null); // Reference to chat container for auto-scroll
const userId = ref(null); // Store current user ID

// Get current user on component mount
onMounted(async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (user) userId.value = user.id;
});

// Auto-scroll chat to bottom
function scrollChatToBottom() {
  nextTick(() => {
    if (chatContainer.value) {
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
    }
  });
}

// Helper function to extract text from PDF
async function extractTextFromPDF(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let text = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map(item => item.str).join(' ');
    text += pageText + '\n';
  }

  return text;
}

// Helper function to extract text from DOCX
async function extractTextFromDOCX(file) {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

// Helper function to extract text from PPTX
async function extractTextFromPPTX(file) {
  const arrayBuffer = await file.arrayBuffer();
  const zip = new JSZip();
  await zip.loadAsync(arrayBuffer);

  let text = '';
  let slideCount = 0;

  // Extract text from slide XMLs
  for (const filename in zip.files) {
    if (filename.startsWith('ppt/slides/slide') && filename.endsWith('.xml')) {
      slideCount++;
      const content = await zip.files[filename].async('string');
      // Extract text from XML tags
      const textMatches = content.match(/<a:t>([^<]*)<\/a:t>/g);
      if (textMatches) {
        text += `\n=== Slide ${slideCount} ===\n`;
        textMatches.forEach(match => {
          const textContent = match.replace(/<\/?a:t>/g, '');
          if (textContent.trim()) {
            text += textContent + '\n';
          }
        });
      }
    }
  }

  return text || 'No text found in presentation';
}

// File upload handler with multi-format support
async function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  uploadedFile.value = file;
  error.value = null;
  isLoading.value = true;

  try {
    let text = '';
    const fileExtension = file.name.split('.').pop().toLowerCase();

    if (fileExtension === 'pdf') {
      text = await extractTextFromPDF(file);
    } else if (fileExtension === 'docx' || fileExtension === 'doc') {
      text = await extractTextFromDOCX(file);
    } else if (fileExtension === 'pptx' || fileExtension === 'ppt') {
      text = await extractTextFromPPTX(file);
    } else if (fileExtension === 'txt' || fileExtension === 'md') {
      text = await file.text();
    } else {
      throw new Error('Unsupported file type. Please upload PDF, DOCX, PPTX, TXT, or MD files.');
    }

    fileContent.value = text;

    // Add message about file upload
    chatHistory.value.push({
      role: 'system',
      content: `📄 File uploaded: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`
    });

    // Automatically start quiz mode
    await startQuiz();
  } catch (err) {
    error.value = `Failed to read file: ${err.message || 'Please try again.'}`;
    console.error(err);
    uploadedFile.value = null;
  } finally {
    isLoading.value = false;
  }
}

// Start quiz mode with uploaded file content
async function startQuiz(retryCount = 0) {
  // Check if quiz is complete (reached 5 questions)
  if (quizScore.value.total >= TOTAL_QUESTIONS) {
    currentQuestion.value = null;

    // Calculate percentage and check if passed
    const percentage = (quizScore.value.correct / TOTAL_QUESTIONS) * 100;
    const passed = percentage >= 50;

    let resultMessage = `Quiz complete! You answered ${quizScore.value.correct} out of ${TOTAL_QUESTIONS} questions correctly.\n\nFinal Score: ${quizScore.value.correct}/${TOTAL_QUESTIONS} (${percentage.toFixed(1)}%)`;

    // Award points if passed (>= 50%)
    if (passed && userId.value) {
      try {
        await awardPoints(userId.value, 5, 'Passed quiz');
        resultMessage += '\n\n🎉 You passed! You earned 5 points!';
      } catch (err) {
        console.error('Error awarding points:', err);
      }
    }

    chatHistory.value.push({
      role: 'assistant',
      content: resultMessage
    });
    scrollChatToBottom();
    return;
  }

  if (!fileContent.value) {
    error.value = "Please upload a file first.";
    return;
  }

  // Validate that we have enough content for quiz generation
  if (fileContent.value.trim().length < 100) {
    error.value = "File content is too short. Please upload a file with more substantial content.";
    return;
  }

  isLoading.value = true;
  isQuizMode.value = true;
  error.value = null; // Clear previous errors

  try {
    // Build list of previously asked questions to avoid repetition
    const previousQuestionsText = previousQuestions.value.length > 0
      ? `\n\nIMPORTANT: DO NOT generate these exact questions again:\n${previousQuestions.value.map((q, i) => `${i + 1}. ${q}`).join('\n')}`
      : '';

    const response = await groq.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content: `You are an expert quiz generator. Your task is to create high-quality, unambiguous multiple-choice questions based on the provided content. Generate 10 questions. Return ONLY valid JSON with no other text, no markdown, no backticks.
                    JSON format:
                    {
                      "Questions": {
                        "Question_1": {
                          "Question": "Clear, specific question that tests understanding of the content",
                          "Options": {
                            "A": "Plausible but incorrect option",
                            "B": "Plausible but incorrect option",
                            "C": "Plausible but incorrect option",
                            "D": "Correct answer based on the content"
                          },
                          "Correct Answer": "D"
                        }
                      }
                    }

                    CRITICAL RULES:
                    1. The correct answer must be unambiguously correct based on the provided content
                    2. Questions must test comprehension, not trick the student
                    3. All options should be grammatically consistent and plausible
                    4. Options should not be obviously wrong (avoid "none of the above" or absurd choices)
                    5. Questions should focus on key concepts, definitions, and relationships from the content
                    6. Avoid questions answerable without reading the content
                    7. Vary question types: factual recall, comprehension, application, analysis
                    8. Each question should stand alone and be clear
                    9. For math questions, please check your answers two times to ensure it is factually correct

                    QUESTION TYPES TO USE:
                    - Definition questions: "What is X defined as?"
                    - Relationship questions: "How does X relate to Y?"
                    - Implication questions: "Which of the following is a consequence of X?"
                    - Example questions: "Which of the following is an example of X?"
                    - Concept questions: "What is the main idea of X?"

                    Generate questions that would be appropriate for a student who has read the provided content.`
        },
        
        {
          role: "user",
          content: `Content to create question from:\n\n${fileContent.value.substring(0, 3000)}${previousQuestionsText}\n\nGenerate ONE new quiz question. RESPOND WITH ONLY THE JSON - no markdown, no backticks, no explanations.`
        }
      ],
      temperature: 1,
      max_completion_tokens: 1024,
      top_p: 1,
      stream: false
    });

    const quizText = response.choices[0].message.content;
    console.log('Raw API response:', quizText);

    currentQuestion.value = parseQuizQuestion(quizText);

    // Validate the parsed question has basic requirements
    if (!currentQuestion.value.question || !currentQuestion.value.question.trim()) {
      throw new Error('Question text is empty.');
    }

    if (!currentQuestion.value.options || currentQuestion.value.options.length !== 4) {
      throw new Error(`Expected 4 options, got ${currentQuestion.value.options?.length || 0}`);
    }

    if (!currentQuestion.value.correct) {
      throw new Error('No correct answer specified.');
    }

    // Optional: Verify math answers on client-side (only for simple arithmetic)
    // Disabled for now since AI accuracy is good - can be re-enabled if needed
    // if (!verifyMathAnswer(currentQuestion.value, currentQuestion.value.correct)) {
    //   throw new Error('Math answer verification failed. Regenerating...');
    // }

    // Track this question to avoid repeating it
    if (currentQuestion.value.question) {
      previousQuestions.value.push(currentQuestion.value.question);
    }

    chatHistory.value.push({
      role: 'assistant',
      content: `Let's test your knowledge! Here's question ${quizScore.value.total + 1}:\n\n${formatQuestionForDisplay(currentQuestion.value)}`
    });

    // Auto-scroll to show the new question
    scrollChatToBottom();
  } catch (err) {
    console.error('Quiz generation error:', err);

    // Retry up to 5 times before giving up
    if (retryCount < 5) {
      console.log(`Retrying question generation (attempt ${retryCount + 2}/6)...`);
      isLoading.value = false;
      setTimeout(() => startQuiz(retryCount + 1), 800);
      return;
    }

    error.value = `Failed to generate valid questions. Error: ${err.message}. Please try resetting the quiz.`;
    isQuizMode.value = false;
  } finally {
    isLoading.value = false;
  }
}

// Parse quiz question from AI response (expects new JSON format)
function parseQuizQuestion(text) {
  console.log('Raw AI response:', text);

  try {
    // Try to extract JSON from the response (in case it has markdown or extra text)
    let jsonText = text;

    // Remove markdown code blocks if present
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1];
    }

    // Try to find JSON object
    const jsonObjectMatch = text.match(/\{[\s\S]*"Questions"[\s\S]*\}/);
    if (jsonObjectMatch) {
      jsonText = jsonObjectMatch[0];
    }

    // Try to parse as JSON
    const jsonData = JSON.parse(jsonText);

    // Handle new format: Questions > Question_1 > Question/Options/Correct Answer
    const questionObj = jsonData.Questions?.Question_1;
    if (!questionObj) {
      throw new Error('Invalid JSON structure: missing Questions.Question_1');
    }

    const question = {
      question: questionObj.Question || '',
      options: [],
      correct: (questionObj['Correct Answer'] || '').toUpperCase()
    };

    // Convert options object to array format
    if (questionObj.Options && typeof questionObj.Options === 'object') {
      ['A', 'B', 'C', 'D'].forEach(letter => {
        if (questionObj.Options[letter]) {
          question.options.push(`${letter}) ${questionObj.Options[letter]}`);
        }
      });
    }

    // Validate that the correct answer letter is valid (A, B, C, or D)
    if (!['A', 'B', 'C', 'D'].includes(question.correct)) {
      console.error('Invalid correct answer letter:', question.correct);
      throw new Error(`Invalid correct answer: ${question.correct}. Must be A, B, C, or D`);
    }

    // Validate that we have exactly 4 options
    if (question.options.length !== 4) {
      console.error('Invalid number of options:', question.options.length);
      throw new Error(`Invalid number of options: ${question.options.length}. Must be exactly 4`);
    }

    // Validate that all options are unique (extract just the values)
    const optionValues = ['A', 'B', 'C', 'D'].map(letter => (questionObj.Options[letter] || '').trim());
    const uniqueOptions = new Set(optionValues);
    if (uniqueOptions.size !== 4) {
      console.error('Duplicate options detected:', optionValues);
      throw new Error('Duplicate options detected. All options must be unique.');
    }

    console.log('Parsed JSON question:', question);
    console.log('Correct answer:', question.correct);
    return question;
  } catch (err) {
    console.warn('Failed to parse new JSON format:', err);

    // Fallback to old format for backward compatibility
    try {
      const jsonData = JSON.parse(text);
      const question = {
        question: jsonData.question || '',
        options: [],
        correct: (jsonData.correct || '').toUpperCase()
      };

      if (jsonData.options && typeof jsonData.options === 'object') {
        ['A', 'B', 'C', 'D'].forEach(letter => {
          if (jsonData.options[letter]) {
            question.options.push(`${letter}) ${jsonData.options[letter]}`);
          }
        });
      }

      console.log('Parsed old JSON format:', question);
      return question;
    } catch (err2) {
      console.warn('Failed to parse old JSON format too:', err2);
      return {
        question: 'Error parsing question',
        options: [],
        correct: ''
      };
    }
  }
}

// Format question for display
function formatQuestionForDisplay(q) {
  if (!q) return '';
  return `${q.question}\n\n${q.options.join('\n')}`;
}

// Handle quiz answer
async function submitAnswer(answer) {
  if (!currentQuestion.value) return;

  const userAnswer = answer.toUpperCase();
  const correctAnswer = currentQuestion.value.correct.toUpperCase();
  const isCorrect = userAnswer === correctAnswer;

  // Debug log
  console.log('Question:', currentQuestion.value.question);
  console.log('Correct answer stored:', correctAnswer);
  console.log('User answer:', userAnswer);
  console.log('Is correct:', isCorrect);

  quizScore.value.total++;

  if (isCorrect) {
    quizScore.value.correct++;
    chatHistory.value.push({
      role: 'user',
      content: `My answer: ${userAnswer}`
    });
    chatHistory.value.push({
      role: 'assistant',
      content: `✅ Correct! Great job!\n\nScore: ${quizScore.value.correct}/${quizScore.value.total}`
    });
  } else {
    chatHistory.value.push({
      role: 'user',
      content: `My answer: ${userAnswer}`
    });
    chatHistory.value.push({
      role: 'assistant',
      content: `❌ Incorrect. The correct answer is ${correctAnswer}.\n\nScore: ${quizScore.value.correct}/${quizScore.value.total}`
    });
  }

  // Auto-scroll to bottom to show the answer
  scrollChatToBottom();

  currentQuestion.value = null;

  // Generate next question after a short delay
  setTimeout(() => startQuiz(), 1000);
}


function resetQuiz() {
  uploadedFile.value = null;
  fileContent.value = '';
  isQuizMode.value = false;
  currentQuestion.value = null;
  quizScore.value = { correct: 0, total: 0 };
  chatHistory.value = [];
  error.value = null;
  previousQuestions.value = []; // Clear tracked questions
}
</script>

<template>
  <div class="studyPlannerContainer">
    <div class="tasksHeading">
      <h1 class="pageTitle">STUDY QUIZ AI</h1>
    </div>

    <div class="chatContainer">
      <!-- File upload section -->
      <div v-if="!isQuizMode" class="uploadSection">
        <div class="welcomeMessage">
          <h2>📚 Upload Your Study Material</h2>
          <p>Upload a file (PDF, DOCX, PPTX, TXT, or MD) and I'll quiz you on its contents!</p>
        </div>

        <label for="fileInput" class="uploadBtn">
          📄 Choose File
        </label>
        <input
          id="fileInput"
          type="file"
          accept=".txt,.md,.pdf,.doc,.docx,.ppt,.pptx"
          @change="handleFileUpload"
          style="display: none;"
        />

        <div v-if="uploadedFile" class="fileInfo">
          Selected: {{ uploadedFile.name }}
        </div>
      </div>

      <!-- Error message -->
      <div v-if="error" class="errorMessage">
        {{ error }}
      </div>

      <!-- Quiz score display -->
      <div v-if="isQuizMode" class="scoreDisplay">
        Score: {{ quizScore.correct }} / {{ quizScore.total }}
        <button @click="resetQuiz" class="resetBtn">Reset Quiz</button>
      </div>

      <!-- Chat history -->
      <div class="chatHistory" v-if="chatHistory.length > 0" ref="chatContainer">
        <div v-if="chatHistory.length === 0" class="welcomeMessage">
          <h2>👋 Welcome to Study Planner AI!</h2>
          <p>Ask me anything about:</p>
          <ul>
            <li>Creating study schedules</li>
            <li>Study tips for specific subjects</li>
            <li>Time management strategies</li>
            <li>Learning techniques</li>
          </ul>
        </div>

        <div
          v-for="(message, index) in chatHistory"
          :key="index"
          :class="['message', message.role]"
        >
          <div class="messageContent">
            <strong v-if="message.role === 'user'">You:</strong>
            <strong v-else-if="message.role === 'system'">System:</strong>
            <strong v-else>AI Assistant:</strong>
            <p>{{ message.content }}</p>
          </div>
        </div>

        <div v-if="isLoading" class="message assistant">
          <div class="messageContent">
            <strong>AI Assistant:</strong>
            <p class="typing">Thinking...</p>
          </div>
        </div>
      </div>

      <!-- Quiz answer buttons -->
      <div v-if="isQuizMode && currentQuestion" class="answerButtons">
        <button
          v-for="option in ['A', 'B', 'C', 'D']"
          :key="option"
          @click="submitAnswer(option)"
          class="answerBtn"
          :disabled="isLoading"
        >
          {{ option }}
        </button>
      </div>

    </div>
  </div>
</template>

<style scoped>
.studyPlannerContainer {
  padding: 20px;
  max-width: 900px;
  margin: 0 auto;
}

.chatContainer {
  background-color: #fdf9ee;
  border-radius: 8px;
  padding: 20px;
  height: 80vh;
  max-height: 800px;
  display: flex;
  flex-direction: column;
}

.uploadSection {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 40px 20px;
}

.uploadBtn {
  padding: 15px 40px;
  background-color: #6d412a;
  color: #fdf9ee;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.uploadBtn:hover {
  background-color: #8b5a3c;
  transform: scale(1.05);
}

.fileInfo {
  background-color: #e7bf8f;
  padding: 10px 20px;
  border-radius: 8px;
  color: #6d412a;
  font-weight: 500;
}

.scoreDisplay {
  background-color: #6d412a;
  color: #fdf9ee;
  padding: 12px 20px;
  border-radius: 8px;
  text-align: center;
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}

.resetBtn {
  padding: 8px 20px;
  background-color: #e7bf8f;
  color: #6d412a;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.resetBtn:hover {
  background-color: #d4ad7b;
  transform: scale(1.05);
}

.answerButtons {
  display: flex;
  gap: 10px;
  justify-content: center;
  align-items: center;
  margin-top: 12px;
  margin-bottom: 12px;
  flex-wrap: wrap;
  flex-shrink: 0;
}

.answerBtn {
  padding: 10px 25px;
  background-color: #6d412a;
  color: #fdf9ee;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 70px;
}

.answerBtn:hover:not(:disabled) {
  background-color: #8b5a3c;
  transform: scale(1.1);
}

.answerBtn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
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

.chatHistory {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  margin-bottom: 15px;
  padding: 10px;
  border: 1px solid #e0d5c7;
  border-radius: 4px;
  background-color: white;
}

.welcomeMessage {
  text-align: center;
  color: #6d412a;
  padding: 40px 20px;
}

.welcomeMessage h2 {
  margin-bottom: 20px;
}

.welcomeMessage ul {
  text-align: left;
  display: inline-block;
  margin-top: 15px;
}

.welcomeMessage li {
  margin: 10px 0;
}

.message {
  margin-bottom: 15px;
  padding: 15px;
  border-radius: 8px;
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message.user {
  background-color: #e7bf8f;
  margin-left: 20%;
}

.message.assistant {
  background-color: #d4ad7b;
  margin-right: 20%;
}

.message.system {
  background-color: #c9e4ca;
  margin: 0 10%;
  text-align: center;
}

.messageContent strong {
  color: #6d412a;
  display: block;
  margin-bottom: 5px;
}

.messageContent p {
  margin: 0;
  color: #3d2817;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.typing {
  font-style: italic;
  opacity: 0.7;
}


</style>

