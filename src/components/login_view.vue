<template>
  <div class="page-wrapper">

    <!-- LOGIN CONTENT -->
    <div class="back-container">
      <button class="btn-primary" @click="goBack">
        <span class="arrow">←</span>
        <span>Go Back</span>
      </button>
    </div>
    <div class="auth-container">
      <div class="auth-card">
        <h1>{{ isLogin ? 'WELCOME BACK' : 'JOIN US' }}</h1>
        
        <form @submit.prevent="handleSubmit">
            <div class="form-group" v-if="!isLogin">
            <input
                id="username"
                v-model="formData.username"
                type="text"
                required
                placeholder="Username"
            />
            </div>

          <div class="form-group">
          <input
              id="email"
              v-model="formData.email"
              type="text"
              required
              :placeholder="isLogin ? 'Email or Username' : 'Email'"
          />
          </div>
        
          <div class="form-group password-container">
            <input
              id="password"
              v-model="formData.password"
              :type="showPassword ? 'text' : 'password'"
              required
              placeholder="Password"
              minlength="6"
            />
            <span class="toggle-visibility" @click="showPassword = !showPassword">
              {{ showPassword ? '🙈' : '👁️' }}
            </span>
          </div>

          <div v-if="isLogin" class="forgot-password">
            <a href="#">Forgot Password?</a>
          </div>

          <div v-if="error" class="error-message">
            {{ error }}
          </div>

          <button type="submit" class="btn-primary" :disabled="loading">
            {{ loading ? 'LOADING...' : (isLogin ? 'LOGIN' : 'SIGN UP') }}
          </button>

          <div class="toggle-auth">
            <strong>{{ isLogin ? "Not a member yet?" : 'Already have an account?' }}</strong>
            <a href="#" @click.prevent="toggleMode">
              {{ isLogin ? 'Sign up here!' : 'Login here!' }}
            </a>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from './useAuth'

const router = useRouter()
const { signIn, signUp, loading, error } = useAuth()

const isLogin = ref(true)
const showPassword = ref(false)
const formData = reactive({
  username: '',
  email: '',
  password: ''
})

const toggleMode = () => {
  isLogin.value = !isLogin.value
  error.value = null
}

const handleSubmit = async () => {
  let result

  if (isLogin.value) {
    result = await signIn(formData.email, formData.password)
  } else {
    result = await signUp(formData.email, formData.password, formData.username)
  }

  if (result.success) {
    router.push('/')
  }
}

function goBack() {
  if (window.history.length > 1) router.back()
  else router.push('/')
}

</script>

<style scoped>
.back-container {
  max-width: 200px;
  display: flex;
  justify-content: left;
  margin-top: 2rem;
}

.page-wrapper {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, rgba(111, 63, 36, 0.95), rgba(139, 90, 63, 0.92)),
              url('../assets/background.jpg') no-repeat center center fixed;
  background-size: cover;
}


/* AUTH CONTAINER */
.auth-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
}

.auth-card {
  width: 100%;
  max-width: 450px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

h1 {
  font-size: 45px;
  margin-bottom: 50px;
  font-weight: bold;
  letter-spacing: 4px;
  color: #f5e6d3;
  font-family: 'Georgia', serif;
  text-align: center;
  text-shadow: 3px 3px 6px rgba(0, 0, 0, 0.4);
  white-space: nowrap;
}

form {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  width: 100%;
}

input {
  width: 100%;
  padding: 15px 20px;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  color: #6f4a37;
  background-color: #fbe8d3;
  font-family: 'Georgia', serif;
  transition: box-shadow 0.3s, transform 0.2s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

input:focus {
  outline: none;
  box-shadow: 0 4px 15px rgba(212, 184, 150, 0.6);
  transform: translateY(-2px);
}

input::placeholder {
  color: #a89179;
}

.password-container {
  position: relative;
}

.toggle-visibility {
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
  font-size: 20px;
  user-select: none;
}

.forgot-password {
  text-align: right;
  font-size: 14px;
  margin-top: -5px;
}

.forgot-password a {
  color: #fbe8d3;
  text-decoration: underline;
  transition: color 0.3s;
}

.forgot-password a:hover {
  color: #e8d4b8;
}

.btn-primary {
  width: 100%;
  padding: 16px;
  background: linear-gradient(135deg, #d4b896, #c4a886);
  color: #6f4a37;
  border: none;
  border-radius: 10px;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
  font-family: 'Georgia', serif;
  letter-spacing: 2px;
  margin-top: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.btn-primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #c4a886, #b49876);
  transform: translateY(-3px);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.3);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.error-message {
  background: rgba(255, 200, 200, 0.95);
  color: #8b0000;
  padding: 12px;
  border-radius: 10px;
  font-size: 14px;
  border: 2px solid #ff9999;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.toggle-auth {
  margin-top: 10px;
  font-size: 15px;
  text-align: center;
  color: #fbe8d3;
  font-family: 'Georgia', serif;
}

.toggle-auth strong {
  color: #fbe8d3;
}

.toggle-auth a {
  color: #e8d4b8;
  text-decoration: underline;
  margin-left: 5px;
  transition: color 0.3s;
}

.toggle-auth a:hover {
  color: #d4b896;
}

/* FOOTER */
footer {
  background: linear-gradient(135deg, rgba(209, 190, 170, 0.5), rgba(180, 160, 140, 0.4));
  padding: 35px 50px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  backdrop-filter: blur(8px);
  border-top: 1px solid rgba(111, 63, 36, 0.3);
}

.footer-left {
  font-size: 17px;
  font-weight: 900;
  border-top: 2px solid #5c3d2e;
  border-bottom: 2px solid #5c3d2e;
  padding-top: 6px;
  padding-bottom: 6px;
  color: #3d2817;
  letter-spacing: 1px;
  font-family: 'Georgia', serif;
  text-shadow: 1px 1px 2px rgba(255, 255, 255, 0.3);
}

.footer-right ul {
  display: flex;
  flex-direction: column;
  gap: 15px;
  list-style: none;
  text-align: right;
  font-size: 15px;
  color: #3d2817;
  font-weight: 700;
  font-family: 'Georgia', serif;
  margin: 0;
  padding: 0;
}

.footer-right ul li {
  cursor: pointer;
  transition: color 0.3s, transform 0.2s;
  text-shadow: 1px 1px 2px rgba(255, 255, 255, 0.3);
}

.footer-right ul li:hover {
  color: #6f4a37;
  transform: translateX(-3px);
}

/* RESPONSIVE - Tablet and Mobile */
@media (max-width: 1024px) {
  .navbar {
    flex-direction: row;
    justify-content: center;
    padding: 18px 50px;
    background: linear-gradient(135deg, #6f3f24 0%, #8b5a3f 100%);
  }

  .mobile-logo {
    display: block;
  }

  .desktop-only {
    display: none;
  }

  .hamburger {
    display: flex;
    position: absolute;
    left: 20px;
  }

  .nav-left {
    position: fixed;
    left: -100%;
    top: 0;
    height: 100vh;
    width: 250px;
    background-color: #6d412a;
    flex-direction: column;
    padding: 80px 20px 20px 20px;
    transition: left 0.3s ease;
    z-index: 1001;
    gap: 20px;
    box-shadow: 2px 0 10px rgba(0, 0, 0, 0.3);
  }

  .nav-left.menu-open {
    left: 0;
  }

  .menu-overlay {
    display: block;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100vh;
    background: rgba(0, 0, 0, 0.5);
    z-index: 1000;
  }

  .nav-links {
    flex-direction: column;
    gap: 15px;
  }

  .nav-right {
    position: absolute;
    right: 20px;
  }

  h1 {
    font-size: 36px;
    white-space: normal;
  }

  .auth-card {
    max-width: 90%;
  }

  footer {
    flex-direction: column;
    gap: 20px;
    padding: 30px;
  }

  .footer-right ul {
    text-align: left;
  }
}
</style>
