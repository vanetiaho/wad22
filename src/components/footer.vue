<script setup>
</script>

<template>
  <footer class="footer">
    <div class="footer-content">
      <div class="footer-left">MAP & MUG</div>
      <div class="footer-right">
        <ul class="footer-links">
          <li><RouterLink to="/">HOME</RouterLink></li>
          <li><RouterLink to="/map">MAP</RouterLink></li>
          <li><RouterLink to="/reviews">COMMUNITY</RouterLink></li>
          <li><RouterLink to="/tasks">TASKS</RouterLink></li>
          <li><RouterLink to="/reward">REWARDS</RouterLink></li>
          <li><RouterLink to="/camera">STUDY STREAKS</RouterLink></li>
        </ul>
      </div>
    </div>
    <p class="copyright">&copy; 2025 Map & Mug. All rights reserved.</p>
  </footer>
</template>

<style scoped>
.footer {
  background: linear-gradient(135deg, #8b5a3c 0%, #a67c52 100%);
  padding: 40px 50px 30px;
  display: flex;
  flex-direction: column;
  margin-top: auto;
  box-shadow: 0 -2px 15px rgba(0, 0, 0, 0.2);
}

.footer-content {
  display: flex;  
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  width: 100%;
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
  margin-left: auto;
  justify-content: flex-end;
}

.footer-links {
  display: grid;
  grid-template-columns: repeat(2, auto);
  grid-template-rows: repeat(3, auto);
  grid-auto-flow: column;
  column-gap: 50px;
  row-gap: 15px;
  list-style: none;
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
  white-space: nowrap;
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

.copyright {
  text-align: center;
  color: #fbe8d3;
  font-size: 13px;
  font-family: 'Georgia', serif;
  opacity: 0.85;
  margin: 0;
  padding-top: 25px;
  border-top: 1px solid rgba(251, 232, 211, 0.2);
  width: 100%;
}

/* RESPONSIVE - Mobile */
@media (max-width: 768px) {
  .footer {
    padding: 30px 20px;
  }

  .footer-content {
    flex-direction: column;
    gap: 25px;
    text-align: center;
    align-items: center;
    margin-bottom: 20px;
  }

  .footer-links {
    grid-template-columns: repeat(2, 1fr);
    column-gap: 30px;
    row-gap: 15px;
    text-align: center;
    justify-items: center;
  }

  .footer-links li {
    text-align: center;
  }

  .copyright {
    font-size: 12px;
  }
}
</style>