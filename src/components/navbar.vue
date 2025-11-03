<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import supabase from '../config/supabaseClient'; 
import { useRouter } from 'vue-router';
import { logout } from '../../lib/api/auth';

const router = useRouter();
const menuOpen = ref(false);
const showDropdown = ref(false);
const user = ref(null);

const handleClickOutside = (event) => {
  const container = document.querySelector('.user-icon-wrapper');
  if (container && !container.contains(event.target)) {
    showDropdown.value = false;
  }
};

onMounted(() => document.addEventListener('click', handleClickOutside));
onBeforeUnmount(() => document.removeEventListener('click', handleClickOutside));
onMounted(async () => {
  const { data } = await supabase.auth.getUser();
  user.value = data.user;
});

const handleLogout = async () => {
  try {
    await logout();
    router.push('/login');
  } catch (error) {
    console.error('Logout error:', error);
  }
};
</script>

<template>
  <nav class="navbar">
    <!-- Hamburger menu for mobile -->
    <button class="hamburger" @click="menuOpen = !menuOpen">
      <span></span>
      <span></span>
      <span></span>
    </button>

    <div class="nav-left" :class="{ 'menu-open': menuOpen }">
      <div class="logo desktop-only">MAP & MUG</div>
      <ul class="nav-links">
        <li @click="menuOpen = false"><RouterLink to="/">HOME</RouterLink></li>
        <li @click="menuOpen = false"><RouterLink to="/map">MAP</RouterLink></li>
        <li @click="menuOpen = false"><RouterLink to="/reviews">COMMUNITY</RouterLink></li>
        <li @click="menuOpen = false"><RouterLink to="/tasks">TASKS</RouterLink></li>
        <li @click="menuOpen = false"><RouterLink to="/reward">REWARDS</RouterLink></li>
        <li @click="menuOpen = false"><RouterLink to="/camera">STUDY STREAKS⚡</RouterLink></li>
        
      </ul>
    </div>

    <!-- Mobile logo (centered) -->
    <div class="mobile-logo">MAP & MUG</div>
    
    <div class="nav-right">
  <div class="user-icon-wrapper">
    <div class="user-icon" @click="showDropdown = !showDropdown">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="#6f3f24" viewBox="0 0 24 24">
        <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
      </svg>
    </div>

    <!-- Dropdown menu -->
    <div v-if="showDropdown" class="user-dropdown">
      <template v-if="user">
        <a @click="$router.push('/profile_home')">Profile</a>
        <a @click="$router.push('/favourites')">Favourites</a>
        <a @click="handleLogout">Logout</a>
      </template>
      <template v-else>
        <a @click="$router.push('/login')">Sign In</a>
      </template>
    </div>
  </div>
</div>
  </nav>

  <!-- Overlay for mobile menu -->
  <div v-if="menuOpen" class="menu-overlay" @click="menuOpen = false"></div>
</template>

<style scoped>
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

.hamburger {
  display: none;
  flex-direction: column;
  background: none;
  border: none;
  cursor: pointer;
  padding: 10px;
  z-index: 1001;
}

.hamburger span {
  width: 25px;
  height: 3px;
  background-color: #fbe8d3;
  margin: 3px 0;
  transition: 0.3s;
}

.mobile-logo {
  display: none;
  font-size: 18px;
  font-weight: 900;
  color: #fbe8d3;
  letter-spacing: 1px;
  font-family: 'Georgia', serif;
  border-top: 2px solid #fbe8d3;
  border-bottom: 2px solid #fbe8d3;
  padding: 5px 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}

.desktop-only {
  display: block;
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

.nav-links li a {
  color: #fbe8d3;
  text-decoration: none;
}

.nav-links li a.router-link-active {
  color: #e8d4b8;
}

.nav-links li:hover {
  color: #e8d4b8;
  transform: translateY(-2px);
}

.nav-right {
  display: flex;
  align-items: center;
  gap: 20px;
  position: relative;
}
.user-icon-wrapper {
  position: relative;
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
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  transition: transform 0.2s, box-shadow 0.3s;
}

.user-icon:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

/* .menu-overlay {
  display: none;
} */
.user-dropdown {
  position: absolute;
  top: 45px;
  right: 0;
  background-color: #6f3f24;
  padding: 10px 0;
  border-radius: 8px;
  min-width: 130px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.3);
  display: flex;
  flex-direction: column;
  z-index: 100;
}

.user-dropdown a {
  padding: 10px 20px;
  color: #fbe8d3;
  text-decoration: none;
  font-weight: bold;
  font-family: 'Georgia', serif;
  transition: background 0.2s;
}

.user-dropdown a:hover {
  background-color: rgba(255,255,255,0.1);
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
    z-index: 1001;
  }

  .menu-overlay {
    display: block;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100vh;
    background: rgba(0, 0, 0, 0.5);
    z-index: 999;
  }

  .nav-links {
    flex-direction: column;
    gap: 15px;
  }

  .nav-right {
    position: absolute;
    right: 20px;
  }
}
</style>
