<template>
  <div class="page-wrapper">
    <!-- NAVIGATION -->
    <nav class="navbar">
      <div class="nav-left">
        <div class="logo">MAP & MUG</div>
        <ul class="nav-links">
          <li>CAFES</li>
          <li>COMMUNITY</li>
          <li>TASKS</li>
          <li>REWARDS</li>
          <li>MAP</li>
        </ul>
      </div>
      
      <div class="nav-right">
        <div class="search-container">
          <span class="search-icon">🔍</span>
          <input type="text" class="search-bar" placeholder="Search cafes..." />
        </div>
        <div class="user-icon">👤</div>
      </div>
    </nav>

    <!-- LOGIN CONTENT -->
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
              type="email"
              required
              placeholder="Email"
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

    <!-- FOOTER -->
    <footer>
      <div class="footer-left">MAP & MUG</div>
      <div class="footer-right">
        <ul>
          <li>CAFES</li>
          <li>COMMUNITY</li>
          <li>TASKS</li>
          <li>REWARDS</li>
        </ul>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

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
    router.push('/reviews')
  }
}
</script>

<style scoped>
.page-wrapper {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, rgba(111, 63, 36, 0.95), rgba(139, 90, 63, 0.92)),
              url('../assets/background.jpg') no-repeat center center fixed;
  background-size: cover;
}

/* NAVIGATION */
.navbar {
  background: linear-gradient(135deg, #6f3f24 0%, #8b5a3f 100%);
  padding: 18px 50px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 15px rgba(0, 0, 0, 0.3);
  position: sticky;
  top: 0;
  z-index: 1000;
}

.nav-left {
  display: flex;
  align-items: center;
  gap: 40px;
}

.logo {
  font-size: 18px;
  font-weight: 900;
  color: #fbe8d3;
  letter-spacing: 1px;
  font-family: 'Georgia', serif;
  border-top: 2px solid #fbe8d3;
  border-bottom: 2px solid #fbe8d3;
  padding: 5px 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.nav-links {
  display: flex;
  list-style: none;
  gap: 30px;
  margin: 0;
  padding: 0;
}

.nav-links li {
  font-size: 14px;
  font-weight: bold;
  color: #fbe8d3;
  cursor: pointer;
  letter-spacing: 0.5px;
  transition: color 0.3s, transform 0.2s;
  font-family: 'Georgia', serif;
}

.nav-links li:hover {
  color: #e8d4b8;
  transform: translateY(-2px);
}

.nav-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.search-container {
  position: relative;
  width: 300px;
}

.search-bar {
  width: 100%;
  padding: 10px 15px 10px 40px;
  border: none;
  border-radius: 25px;
  font-size: 14px;
  background-color: #fbe8d3;
  color: #6f4a37;
  font-family: 'Georgia', serif;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  transition: box-shadow 0.3s;
}

.search-bar:focus {
  outline: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.search-bar::placeholder {
  color: #a89179;
}

.search-icon {
  position: absolute;
  left: 15px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 16px;
}

.user-icon {
  width: 38px;
  height: 38px;
  background: linear-gradient(135deg, #fbe8d3, #e8d4b8);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  transition: transform 0.2s, box-shadow 0.3s;
}

.user-icon:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
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

/* RESPONSIVE */
@media (max-width: 968px) {
  .navbar {
    flex-direction: column;
    gap: 15px;
    padding: 15px 30px;
  }

  .nav-left {
    flex-direction: column;
    gap: 15px;
    width: 100%;
  }

  .nav-links {
    flex-wrap: wrap;
    gap: 15px;
    justify-content: center;
  }

  .search-container {
    width: 250px;
  }

  h1 {
    font-size: 36px;
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