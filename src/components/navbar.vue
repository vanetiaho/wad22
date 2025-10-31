<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { logout } from '../../lib/api/auth';

const router = useRouter();
const menuOpen = ref(false);

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
        <li @click="menuOpen = false"><RouterLink to="/reviews">COMMUNITY</RouterLink></li>
        <li @click="menuOpen = false"><RouterLink to="/profile_home">PROFILE</RouterLink></li>
        <li @click="menuOpen = false"><RouterLink to="/favourites">FAVOURITES</RouterLink></li>
        <li @click="menuOpen = false"><RouterLink to="/tasks">TASKS</RouterLink></li>
        <li @click="menuOpen = false"><RouterLink to="/reward">REWARDS</RouterLink></li>
        <li @click="menuOpen = false"><RouterLink to="/map">MAP</RouterLink></li>
      </ul>
    </div>

    <!-- Mobile logo (centered) -->
    <div class="mobile-logo">MAP & MUG</div>
    
    <div class="nav-right">
      <button class="user-icon" @click="handleLogout">
        👤
      </button>
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
  position: relative;
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
  border: none;
}

.user-icon:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.menu-overlay {
  display: none;
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
}
</style>