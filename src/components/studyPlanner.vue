<script setup>
import { ref } from 'vue';
import Groq from "groq-sdk";
import * as pdfjsLib from 'pdfjs-dist';
import * as mammoth from 'mammoth';
import JSZip from 'jszip';

// Initialize Groq client
const groq = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
  dangerouslyAllowBrowser: true // Required for client-side usage
});
const model = "llama-3.3-70b-versatile";

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
async function startQuiz() {
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
          content: `You are an expert quiz generator. Your task is to create a single multiple-choice question based on the provided content.

CRITICAL INSTRUCTIONS:
1. You MUST respond with ONLY valid JSON, nothing else - no markdown, no code blocks, no explanations
2. Use this exact JSON structure with no variations:
{
  "Questions": {
    "Question_1": {
      "Question": "A clear, specific question text here",
      "Options": {
        "A": "First option",
        "B": "Second option",
        "C": "Third option",
        "D": "Fourth option"
      },
      "Correct Answer": "A"
    }
  }
}
3. The "Correct Answer" field MUST be exactly one letter: A, B, C, or D
4. All four options MUST be unique and different from each other
5. The correct answer MUST match one of the options A, B, C, or D
6. Create questions that test understanding of the content, not just definitions`
        },
        {
          role: "user",
          content: `Content to create question from:\n\n${fileContent.value.substring(0, 3000)}${previousQuestionsText}\n\nGenerate ONE new quiz question in the exact JSON format specified. Respond with ONLY the JSON object - no markdown, no backticks, no extra text.`
        }
      ],
      temperature: 0.3,
      max_completion_tokens: 300
    });

    const quizText = response.choices[0].message.content;
    console.log('Raw API response:', quizText);

    currentQuestion.value = parseQuizQuestion(quizText);

    // Validate the parsed question has basic requirements
    if (!currentQuestion.value.question || currentQuestion.value.options.length < 4 || !currentQuestion.value.correct) {
      throw new Error('Generated question failed validation. Retrying...');
    }

    // Track this question to avoid repeating it
    if (currentQuestion.value.question) {
      previousQuestions.value.push(currentQuestion.value.question);
    }

    chatHistory.value.push({
      role: 'assistant',
      content: `Let's test your knowledge! Here's question ${quizScore.value.total + 1}:\n\n${formatQuestionForDisplay(currentQuestion.value)}`
    });
  } catch (err) {
    console.error('Quiz generation error:', err);
    error.value = `Failed to generate quiz question: ${err.message}. Please try uploading a file with different content or reset the quiz.`;
    isQuizMode.value = false;
  } finally {
    isLoading.value = false;
  }
}

// Helper function to verify and fix correct answer for math problems
function verifyCorrectAnswer(question, questionObj) {
  const questionText = (question.question || '').toLowerCase();

  // Check if it's a math problem (contains operators like +, -, *, /)
  if (!/[+\-*/]/.test(questionText)) {
    // Not a math problem, so we can't verify it - return
    return;
  }

  console.log('Verifying math problem...');
  console.log('Question:', questionText);
  console.log('Marked correct answer:', question.correct);

  try {
    // Extract the math expression from the question
    const mathMatch = questionText.match(/(\d+)\s*([+\-*/])\s*(\d+)/);
    if (!mathMatch) {
      console.log('Could not extract math expression');
      return;
    }

    const num1 = parseInt(mathMatch[1]);
    const operator = mathMatch[2];
    const num2 = parseInt(mathMatch[3]);

    let expectedAnswer;
    switch(operator) {
      case '+': expectedAnswer = num1 + num2; break;
      case '-': expectedAnswer = num1 - num2; break;
      case '*': expectedAnswer = num1 * num2; break;
      case '/': expectedAnswer = Math.floor(num1 / num2); break;
      default: return;
    }

    console.log(`Calculation: ${num1} ${operator} ${num2} = ${expectedAnswer}`);

    // Find which option contains the expected answer
    const options = questionObj.Options;
    let correctLetter = null;

    for (const letter of ['A', 'B', 'C', 'D']) {
      const optionText = (options[letter] || '').trim();
      const optionNumber = parseInt(optionText);

      if (!isNaN(optionNumber) && optionNumber === expectedAnswer) {
        correctLetter = letter;
        console.log(`Found correct answer at option ${letter}: ${optionNumber}`);
        break;
      }
    }

    // If we found the correct answer and it doesn't match what the AI said
    if (correctLetter && correctLetter !== question.correct) {
      console.warn(`AI marked "${question.correct}" as correct, but "${correctLetter}" is the actual correct answer`);
      // Correct the answer
      question.correct = correctLetter;
      console.log(`Auto-corrected to: ${question.correct}`);
    } else if (!correctLetter) {
      console.warn('Could not find option matching the correct calculation result');
    }
  } catch (err) {
    console.warn('Error during math verification:', err);
  }
}

// Parse quiz question from AI response (expects new JSON format)
function parseQuizQuestion(text) {
  console.log('Raw AI response:', text);

  try {
    // Try to parse as JSON
    const jsonData = JSON.parse(text);

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

    // Verify the correct answer (especially for math problems)
    verifyCorrectAnswer(question, questionObj);

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
      <h1 class="tasksTitle">STUDY QUIZ AI</h1>
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
      <div class="chatHistory" v-if="chatHistory.length > 0">
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

