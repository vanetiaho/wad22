<script setup>
</script>

<template>
  <footer class="footer">
    <div class="footer-left">MAP & MUG
    </div>
    <div class="footer-right">
      <ul class="footer-links">
        <li><RouterLink to="/">HOME</RouterLink></li>
        <li><RouterLink to="/map">MAP</RouterLink></li>
        <li><RouterLink to="/reviews">COMMUNITY</RouterLink></li>
        <li><RouterLink to="/tasks">TASKS</RouterLink></li>
        <li><RouterLink to="/reward">REWARDS</RouterLink></li>
        <li><RouterLink to="/camera">STUDY STREAKS⚡</RouterLink></li>
        
        <li><p>&copy; 2025 Map & Mug. All rights reserved.</p></li>
      </ul>
      
    </div>
  </footer>
</template>

<style scoped>
.footer {
  background: linear-gradient(135deg, #8b5a3c 0%, #a67c52 100%);
  padding: 60px 50px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
  box-shadow: 0 -2px 15px rgba(0, 0, 0, 0.2);
}

.footer-left {
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

.footer-right {
  display: flex;
  align-items: center;
}

.footer-links {
  display: flex;
  list-style: none;
  gap: 5px;
  margin: 0;
  padding: 0;
}

.footer-links li {
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  letter-spacing: 0.5px;
  transition: color 0.3s, transform 0.2s;
  font-family: 'Georgia', serif;
}

.footer-links li a {
  color: #fbe8d3;
  text-decoration: none;
  transition: color 0.3s;
}

.footer-links li a:hover {
  color: #e8d4b8;
}

.footer-links li a.router-link-active {
  color: #e8d4b8;
}

/* RESPONSIVE - Mobile */
@media (max-width: 768px) {
  .footer {
    flex-direction: column;
    gap: 25px;
    padding: 30px 20px;
    text-align: center;
  }

  .footer-links {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }
}
</style>
