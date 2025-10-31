<script setup>
import { ref } from 'vue';
import Groq from "groq-sdk";

// Initialize Groq client
const groq = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
  dangerouslyAllowBrowser: true // Required for client-side usage
});
const model = "llama-3.3-70b-versatile";

// Component state
const userInput = ref('');
const chatHistory = ref([]);
const isLoading = ref(false);
const error = ref(null);
const uploadedFile = ref(null);
const fileContent = ref('');
const isQuizMode = ref(false);
const currentQuestion = ref(null);
const quizScore = ref({ correct: 0, total: 0 });

// File upload handler
async function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  uploadedFile.value = file;
  error.value = null;

  try {
    const text = await file.text();
    fileContent.value = text;

    // Add message about file upload
    chatHistory.value.push({
      role: 'system',
      content: `📄 File uploaded: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`
    });

    // Automatically start quiz mode
    await startQuiz();
  } catch (err) {
    error.value = "Failed to read file. Please try again.";
    console.error(err);
  }
}

// Start quiz mode with uploaded file content
async function startQuiz() {
  if (!fileContent.value) {
    error.value = "Please upload a file first.";
    return;
  }

  isLoading.value = true;
  isQuizMode.value = true;

  try {
    const response = await groq.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content: "You are a quiz generator. Based on the provided study material, generate one multiple-choice question with 4 options (A, B, C, D) and indicate the correct answer. Format your response as:\nQUESTION: [question]\nA) [option]\nB) [option]\nC) [option]\nD) [option]\nCORRECT: [letter]"
        },
        {
          role: "user",
          content: `Generate a quiz question based on this content:\n\n${fileContent.value.substring(0, 3000)}`
        }
      ],
      temperature: 0.7,
      max_completion_tokens: 500
    });

    const quizText = response.choices[0].message.content;
    currentQuestion.value = parseQuizQuestion(quizText);

    chatHistory.value.push({
      role: 'assistant',
      content: `Let's test your knowledge! Here's question ${quizScore.value.total + 1}:\n\n${formatQuestionForDisplay(currentQuestion.value)}`
    });
  } catch (err) {
    error.value = "Failed to generate quiz question.";
    console.error(err);
  } finally {
    isLoading.value = false;
  }
}

// Parse quiz question from AI response
function parseQuizQuestion(text) {
  const lines = text.split('\n').filter(line => line.trim());
  const question = {
    question: '',
    options: [],
    correct: ''
  };

  lines.forEach(line => {
    if (line.startsWith('QUESTION:')) {
      question.question = line.replace('QUESTION:', '').trim();
    } else if (line.match(/^[A-D]\)/)) {
      question.options.push(line.trim());
    } else if (line.startsWith('CORRECT:')) {
      question.correct = line.replace('CORRECT:', '').trim().toUpperCase().charAt(0);
    }
  });

  return question;
}

// Format question for display
function formatQuestionForDisplay(q) {
  if (!q) return '';
  return `${q.question}\n\n${q.options.join('\n')}`;
}

// Handle quiz answer
async function submitAnswer(answer) {
  if (!currentQuestion.value) return;

  const isCorrect = answer.toUpperCase() === currentQuestion.value.correct;
  quizScore.value.total++;

  if (isCorrect) {
    quizScore.value.correct++;
    chatHistory.value.push({
      role: 'user',
      content: `My answer: ${answer.toUpperCase()}`
    });
    chatHistory.value.push({
      role: 'assistant',
      content: `✅ Correct! Great job!\n\nScore: ${quizScore.value.correct}/${quizScore.value.total}`
    });
  } else {
    chatHistory.value.push({
      role: 'user',
      content: `My answer: ${answer.toUpperCase()}`
    });
    chatHistory.value.push({
      role: 'assistant',
      content: `❌ Incorrect. The correct answer is ${currentQuestion.value.correct}.\n\nScore: ${quizScore.value.correct}/${quizScore.value.total}`
    });
  }

  currentQuestion.value = null;

  // Generate next question after a short delay
  setTimeout(() => startQuiz(), 1000);
}

// Define tools (you can customize these for study planning)
function getStudyTip(topic) {
  const tips = {
    "math": "Break down complex problems into smaller steps. Practice regularly and review mistakes.",
    "science": "Use diagrams and visual aids. Connect concepts to real-world examples.",
    "language": "Practice daily conversation. Use flashcards for vocabulary building.",
    "history": "Create timelines and mind maps. Connect events to understand cause and effect."
  };
  return tips[topic.toLowerCase()] || "Study consistently, take breaks, and stay organized.";
}

function getStudySchedule(hours) {
  const hoursNum = parseInt(hours);
  if (hoursNum <= 2) {
    return "Short session: 25 min study, 5 min break (Pomodoro technique)";
  } else if (hoursNum <= 4) {
    return "Medium session: 50 min study, 10 min break. Repeat 2-3 times.";
  } else {
    return "Long session: 90 min study, 20 min break. Include meal breaks.";
  }
}

const tools = [
  {
    "type": "function",
    "function": {
      "name": "getStudyTip",
      "description": "Get study tips for a specific subject or topic",
      "parameters": {
        "type": "object",
        "properties": {
          "topic": {
            "type": "string",
            "description": "The subject or topic (e.g., math, science, language, history)",
          }
        },
        "required": ["topic"],
      },
    },
  },
  {
    "type": "function",
    "function": {
      "name": "getStudySchedule",
      "description": "Get a recommended study schedule based on available hours",
      "parameters": {
        "type": "object",
        "properties": {
          "hours": {
            "type": "string",
            "description": "Number of hours available for studying",
          }
        },
        "required": ["hours"],
      },
    },
  }
];

// Main AI chat function
async function sendMessage() {
  if (!userInput.value.trim()) return;

  error.value = null;
  isLoading.value = true;

  // Add user message to chat history
  chatHistory.value.push({
    role: 'user',
    content: userInput.value
  });

  userInput.value = ''; // Clear input

  try {
    const messages = [
      { "role": "system", "content": "You are a helpful study planning assistant. Help users create effective study plans, provide study tips, and manage their learning schedule." },
      ...chatHistory.value
    ];

    const response = await groq.chat.completions.create({
      model,
      messages,
      tools,
      temperature: 0.5,
      tool_choice: "auto",
      max_completion_tokens: 4096
    });

    const responseMessage = response.choices[0].message;
    const toolCalls = responseMessage.tool_calls || [];

    // Process tool calls if any
    if (toolCalls.length > 0) {
      messages.push(responseMessage);

      const availableFunctions = {
        getStudyTip,
        getStudySchedule,
      };

      for (const toolCall of toolCalls) {
        const functionName = toolCall.function.name;
        const functionToCall = availableFunctions[functionName];
        const functionArgs = JSON.parse(toolCall.function.arguments);

        let functionResponse;
        if (functionName === 'getStudyTip') {
          functionResponse = functionToCall(functionArgs.topic);
        } else if (functionName === 'getStudySchedule') {
          functionResponse = functionToCall(functionArgs.hours);
        }

        if (functionResponse) {
          messages.push({
            role: "tool",
            content: functionResponse,
            tool_call_id: toolCall.id,
          });
        }
      }

      // Make final request with tool results
      const finalResponse = await groq.chat.completions.create({
        model,
        messages,
        tools,
        temperature: 0.5,
        tool_choice: "auto",
        max_completion_tokens: 4096
      });

      chatHistory.value.push({
        role: 'assistant',
        content: finalResponse.choices[0].message.content
      });
    } else {
      // No tool calls, just add the response
      chatHistory.value.push({
        role: 'assistant',
        content: responseMessage.content
      });
    }
  } catch (err) {
    console.error("Error:", err);
    error.value = "An error occurred. Please make sure you have set up your GROQ API key.";
  } finally {
    isLoading.value = false;
  }
}

function clearChat() {
  chatHistory.value = [];
  error.value = null;
  isQuizMode.value = false;
  currentQuestion.value = null;
  quizScore.value = { correct: 0, total: 0 };
}

function resetQuiz() {
  uploadedFile.value = null;
  fileContent.value = '';
  isQuizMode.value = false;
  currentQuestion.value = null;
  quizScore.value = { correct: 0, total: 0 };
  chatHistory.value = [];
  error.value = null;
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
          <p>Upload a text file (.txt, .md, etc.) and I'll quiz you on its contents!</p>
        </div>

        <label for="fileInput" class="uploadBtn">
          📄 Choose File
        </label>
        <input
          id="fileInput"
          type="file"
          accept=".txt,.md,.doc,.docx,text/*"
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

      <!-- Input area (hidden in quiz mode) -->
      <div v-if="!isQuizMode && chatHistory.length > 0" class="inputArea">
        <input
          v-model="userInput"
          @keyup.enter="sendMessage"
          type="text"
          placeholder="Ask about study planning, tips, or schedules..."
          class="chatInput"
          :disabled="isLoading"
        />
        <button
          @click="sendMessage"
          class="sendBtn"
          :disabled="isLoading || !userInput.trim()"
        >
          Send
        </button>
        <button
          @click="clearChat"
          class="clearBtn"
          :disabled="chatHistory.length === 0"
        >
          Clear
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
  min-height: 600px;
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
  padding: 15px 20px;
  border-radius: 8px;
  text-align: center;
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
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
  gap: 15px;
  justify-content: center;
  margin-top: 20px;
  flex-wrap: wrap;
}

.answerBtn {
  padding: 15px 30px;
  background-color: #6d412a;
  color: #fdf9ee;
  border: none;
  border-radius: 8px;
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 80px;
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
  margin-bottom: 20px;
  padding: 10px;
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

.inputArea {
  display: flex;
  gap: 10px;
}

.chatInput {
  flex: 1;
  padding: 12px 15px;
  border: 2px solid #6d412a;
  border-radius: 8px;
  font-size: 14px;
  background-color: white;
}

.chatInput:focus {
  outline: none;
  border-color: #8b5a3c;
}

.sendBtn, .clearBtn {
  padding: 12px 25px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.sendBtn {
  background-color: #6d412a;
  color: #fdf9ee;
}

.sendBtn:hover:not(:disabled) {
  background-color: #8b5a3c;
  transform: scale(1.05);
}

.sendBtn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.clearBtn {
  background-color: #e7bf8f;
  color: #6d412a;
}

.clearBtn:hover:not(:disabled) {
  background-color: #d4ad7b;
  transform: scale(1.05);
}

.clearBtn:disabled {
  background-color: #f0f0f0;
  color: #999;
  cursor: not-allowed;
}
</style>

