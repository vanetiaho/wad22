<template>
  <div class="home-page">

    <!-- HERO VIDEO -->
    <section class="hero" :class="{ 'menu-open': mobileMenuOpen }">
        <video autoplay muted loop class="hero-video">
            <source src="/videos/Hero.mp4" type="video/mp4" />
        </video>

      <div class="overlay">
        <h1>Find your Perfect Nook</h1>
        <p>Discover the best cafes to study and relax.</p>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import supabase from '../config/supabaseClient'
import { useRouter } from 'vue-router'

const router = useRouter()
const showMenu = ref(false)
const mobileMenuOpen = ref(false)
const user = ref(null)

onMounted(async () => {
  const { data } = await supabase.auth.getUser()
  user.value = data.user
})

function logout() {
  supabase.auth.signOut().then(() => user.value = null)
}

function goToProfile() { router.push('/profile') }
function goToFavourites() { router.push('/favourites') }
function signIn() { router.push('/signin') }
function register() { router.push('/register') }

function toggleMobileMenu() {
  mobileMenuOpen.value = !mobileMenuOpen.value
}
</script>

<style scoped>
/* HEADER */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 50px;
  background: rgba(0,0,0,0.5);
  position: fixed;
  width: 100%;
  z-index: 10;
}

.logo {
  color: #fff;
  font-weight: bold;
  font-size: 24px;
}

.nav-links {
  display: flex;
  gap: 30px;
  list-style: none;
  transition: max-height 0.3s ease;
}

.nav-links li a {
  color: #fff;
  text-decoration: none;
  font-weight: bold;
  transition: color 0.3s;
}

.nav-links li a:hover {
  color: #fbe8d3;
}

/* Hamburger Icon */
.hamburger {
  display: none;
  flex-direction: column;
  gap: 5px;
  cursor: pointer;
}

.hamburger span {
  width: 25px;
  height: 3px;
  background-color: #fff;
  transition: all 0.3s ease;
}

.hamburger span.active:nth-child(1) {
  transform: rotate(45deg) translate(5px, 5px);
}
.hamburger span.active:nth-child(2) {
  opacity: 0;
}
.hamburger span.active:nth-child(3) {
  transform: rotate(-45deg) translate(5px, -5px);
}

/* Profile Menu */
.profile-container {
  position: relative;
  cursor: pointer;
}

.profile-menu {
  position: absolute;
  top: 110%;
  right: 0;
  background-color: #7b4b33;
  color: #fff;
  padding: 12px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  min-width: 140px;
  box-shadow: 0 8px 16px rgba(0,0,0,0.3);
}

.profile-menu p {
  margin: 5px 0;
  cursor: pointer;
  transition: background 0.2s;
}

.profile-menu p:hover {
  background: rgba(255,255,255,0.1);
  border-radius: 4px;
  padding-left: 4px;
}

/* Transition */
.fade-slide-enter-active, .fade-slide-leave-active {
  transition: all 0.3s ease;
}
.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}
.fade-slide-enter-to {
  opacity: 1;
  transform: translateY(0);
}
.fade-slide-leave-from {
  opacity: 1;
  transform: translateY(0);
}
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* HERO VIDEO */
.hero {
  position: relative;
  height: 100vh;
  width: 100%;
  overflow: hidden;
  transition: transform 0.3s ease;
}

.hero.menu-open {
  transform: translateY(50px); /* pushes content down when menu opens */
}

.hero-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  color: #fff;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: rgba(0,0,0,0.4);
  text-align: center;
  padding: 0 20px;
  transition: transform 0.3s ease, font-size 0.3s ease;
}

.hero.menu-open .overlay {
  transform: translateY(20px); /* slightly down */
}

.overlay h1 {
  font-size: 64px;
  margin-bottom: 20px;
}

.hero.menu-open .overlay h1 {
  font-size: 56px; /* slightly smaller on menu open */
}

.overlay p {
  font-size: 24px;
}

.hero.menu-open .overlay p {
  font-size: 20px;
}



/* RESPONSIVE */
@media (max-width: 768px) {
  .nav-links {
    position: absolute;
    top: 70px;
    left: 0;
    width: 100%;
    flex-direction: column;
    background-color: rgba(0,0,0,0.9);
    max-height: 0;
    overflow: hidden;
    transition: max-height 0.3s ease;
  }

  .nav-links.open {
    max-height: 300px;
  }

  .nav-links li {
    margin: 15px 0;
    text-align: center;
  }

  .hamburger {
    display: flex;
  }
}

@media (max-width: 480px) {
  .overlay h1 {
    font-size: 28px;
  }

  .overlay p {
    font-size: 16px;
  }
}
</style>

