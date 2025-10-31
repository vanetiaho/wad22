<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import navbar from './components/navbar.vue'
import FooterComponent from './components/footer.vue' 

const route = useRoute()
const showNavbar = computed(() => route.path !== '/login')
const showFooter = computed(() => route.path !== '/login')
</script>

<template>
  <navbar v-if="showNavbar" />
  <RouterView :key="$route.fullPath" />
  <FooterComponent v-if="showFooter" />
</template>

<style scoped>
</style>