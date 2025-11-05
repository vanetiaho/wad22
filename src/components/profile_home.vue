<template>
  <div class="home-container">
    <div class="welcome-section">
      <h1>Welcome back, {{ username }}!</h1>
      <p class="tagline">Discover your next favourite study spot</p>
    </div>

    <div class="quick-stats">
      <div class="stat-card">
        <div class="stat-icon">⭐</div>
        <div class="stat-info">
          <h3>{{ reviewCount }}</h3>
          <p>Reviews</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">❤️</div>
        <div class="stat-info">
          <h3>{{ favouriteCount }}</h3>
          <p>Favourites</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🏆</div>
        <div class="stat-info">
          <h3>{{ totalPoints }}</h3>
          <p>Points</p>
        </div>
      </div>
    </div>

    <div class="sections-grid">
      <router-link to="/reviews" class="section-card">
        <div class="card-icon"><svg width="50" height="50" viewBox="0 0 47.5 47.5" xml:space="preserve" xmlns="http://www.w3.org/2000/svg"><defs><clipPath clipPathUnits="userSpaceOnUse" id="a"><path d="M0 38h38V0H0z"/></clipPath><clipPath clipPathUnits="userSpaceOnUse" id="b"><path d="M0 38h38V0H0z"/></clipPath></defs><g clip-path="url(#a)" transform="matrix(1.25 0 0 -1.25 0 47.5)"><path d="M0 0c0-5.522-8.059-10-18-10S-36-5.522-36 0s8.059 10 18 10S0 5.522 0 0" style="fill:#99aab5;fill-opacity:1;fill-rule:nonzero;stroke:none" transform="translate(37 11)"/><path d="M0 0c0-5.522-8.059-10-18-10S-36-5.522-36 0s8.059 10 18 10S0 5.522 0 0" style="fill:#ccd6dd;fill-opacity:1;fill-rule:nonzero;stroke:none" transform="translate(37 13)"/><path d="M0 0c-14.958 0-17 15-17 19h34c0-2-1.958-19-17-19" style="fill:#f5f8fa;fill-opacity:1;fill-rule:nonzero;stroke:none" transform="translate(19 6)"/><path d="M0 0c-1.357.938-3.103 1.694-5.121 2.25C-3.246 2.826-.57 2.559 0 0m2.503-2.692C4.945 7.43-7.278 5.014-9.701 3.106c-1.34.149-2.736.234-4.181.234-9.389 0-17-3.228-17-8.444s7.611-9.444 17-9.444 17 4.228 17 9.444c0 .862-.225 1.664-.615 2.412" style="fill:#ccd6dd;fill-opacity:1;fill-rule:nonzero;stroke:none" transform="translate(32.882 30.048)"/></g><g clip-path="url(#b)" transform="matrix(1.25 0 0 -1.25 0 47.5)"><path d="M0 0c0-3.866-6.716-7-15-7s-15 3.134-15 7 6.716 7 15 7S0 3.866 0 0" style="fill:#8a4b38;fill-opacity:1;fill-rule:nonzero;stroke:none" transform="translate(34 24)"/><path d="M0 0a1 1 0 0 0-.707.293C-3.044 2.63-3.083 5.178-.832 8.555c.739 1.109.9 2.245.478 3.377-.461 1.235-1.438 1.996-1.731 2.076-.553 0-.958.444-.958.996 0 .553.491.996 1.043.996.997 0 2.395-1.153 3.183-2.625 1.034-1.933.91-4.039-.351-5.93C-1.129 4.503-.699 3.113.707 1.707A.999.999 0 0 0 0 0" style="fill:#d99e82;fill-opacity:1;fill-rule:nonzero;stroke:none" transform="translate(21 20)"/><path d="M0 0a1 1 0 0 0-.707.293C-3.044 2.63-3.083 5.178-.832 8.555c.727 1.091.894 2.082.494 2.947-.444.961-1.431 1.469-1.684 1.499a.99.99 0 0 0-.989.999c0 .553.459 1 1.011 1 .997 0 2.584-.974 3.36-2.423.481-.899 1.053-2.761-.528-5.132C-1.129 4.503-.699 3.113.707 1.707A.999.999 0 0 0 0 0" style="fill:#d99e82;fill-opacity:1;fill-rule:nonzero;stroke:none" transform="translate(15 22)"/></g></svg></div>
        <h2>Browse Cafes</h2>
        <p>Explore all available study spots</p>
      </router-link>

      <router-link to="/my-reviews" class="section-card">
        <div class="card-icon"><svg width="48" height="48" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><title>70 Basic icons by Xicons.co</title><path d="M33 48H4a4 4 0 0 1-4-4V20L13 9h20a4 4 0 0 1 4 4v31a4 4 0 0 1-4 4" fill="#e7e9e9"/><path d="M47.2 7.32 40.66.78a2.81 2.81 0 0 0-3.89 0l-18 18a2 2 0 0 0 0 2.8l7.62 7.63a2 2 0 0 0 1.4.58 2 2 0 0 0 1.4-.58l18-18a2.76 2.76 0 0 0 .01-3.89" fill="#f9d74a"/><path fill="#ec5044" d="m31.502 5.992 3.006-3.004 10.49 10.497-3.006 3.004z"/><path d="m29.26 26.4-7.67-7.68a2 2 0 0 0-3.35 1.06L16.6 29.1a2 2 0 0 0 2.29 2.29l9.32-1.65a2 2 0 0 0 1.05-3.34" fill="#edcabb"/><path d="m20.56 30.14-2.71-2.72a.57.57 0 0 0-.58-.14.58.58 0 0 0-.4.45l-.31 1.75a1.68 1.68 0 0 0 1.65 2h.29l1.75-.31a.58.58 0 0 0 .31-1.03" fill="#4d4d4d"/><path d="M0 20h11a2 2 0 0 0 2-2V9Z" fill="#a1a3a4"/></svg></div>
        <h2>My Reviews</h2>
        <p>See all your cafe reviews</p>
      </router-link>

      <router-link to="/favourites" class="section-card">
        <div class="card-icon"><svg width="50" height="50" viewBox="0 0 1024 1024" class="icon" xmlns="http://www.w3.org/2000/svg"><path d="M725.333 42.667A276.71 276.71 0 0 0 512 142.89 276.71 276.71 0 0 0 298.667 42.667C145.749 42.667 21.333 167.083 21.333 320c0 263.083 457.664 640.576 477.163 656.512a21.23 21.23 0 0 0 27.008 0c19.499-15.936 477.163-393.43 477.163-656.512 0-152.917-124.416-277.333-277.334-277.333" fill="#e86c60"/></svg></div>
        <h2>Favourites</h2>
        <p>Your saved cafes</p>
      </router-link>

      <router-link to="/map" class="section-card">
        <div class="card-icon"><svg width="50" height="50" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="m8 2 8 1v19l-8-1z" fill="#ecf0f1"/><path d="m2 3 6-1v19l-6 1zm14 0 6-1v19l-6 1z" fill="#bdc3c7"/><path d="m3 4 5-1v17l-5 1z" fill="#27ae60"/><path d="m8 3 8 1v17l-8-1z" fill="#2ecc71"/><path d="M13 1a3 3 0 1 0 0 6 3 3 0 0 0 0-6m0 2a1 1 0 1 1 0 2 1 1 0 0 1 0-2" fill="#c0392b"/><path d="m21 20-5 1V4l5-1z" fill="#27ae60"/><path d="m5.688 3.4-2.313.5L8 8.8V5.9zM21 18l-5 1v-6l5-3z" fill="#f39c12"/><path d="m21 20-5 1v-6l5-3z" fill="#2980b9"/><path d="m8 14 8-1v6l-8-1z" fill="#f1c40f"/><path d="m8 16 8-1v6l-8-1z" fill="#3498db"/><path d="m3 17 5-3v4l-5 1z" fill="#f39c12"/><path d="m3 19 5-3v4l-5 1z" fill="#2980b9"/><path d="M8 8.8V5.902l4 8.66h-1.469z" fill="#f1c40f"/><path d="M13 0c-2.209 0-4 1.8-4 4 0 .7.19 1.3.516 1.9q.08.15.171.3L13 12l3.312-5.8c.051-.1.095-.2.141-.2l.031-.1C16.809 5.3 17 4.7 17 4c0-2.2-1.791-4-4-4m0 2c1.105 0 2 .9 2 2s-.895 2-2 2-2-.9-2-2 .895-2 2-2" fill="#e74c3c"/></svg></div>
        <h2>Earn Rewards</h2>
        <p>Complete tasks for points</p>
      </router-link>

      <router-link to="/reward" class="section-card">
        <div class="card-icon"><svg width="50" height="50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 255.971 255.971" xml:space="preserve"><path style="fill:#f9c890" d="M175.7 4.69C169.814.492 162.398-.981 155.354.649s-13.059 6.21-16.503 12.568l-10.865 20.057-10.866-20.057A25.25 25.25 0 0 0 100.617.65a25.25 25.25 0 0 0-20.346 4.041c-12.318 8.785-15.192 25.954-6.407 38.271l.548.768 31.048 27.799 22.525.617 22.525-.617 31.048-27.799.548-.768c8.786-12.318 5.912-29.486-6.406-38.272m-63.543 50.016-24.895-22.29c-2.789-4.62-1.585-10.701 2.88-13.885a8.13 8.13 0 0 1 6.642-1.319 8.14 8.14 0 0 1 5.389 4.103l18.21 33.616zm56.552-22.29-24.895 22.29-8.227.225 18.21-33.616a8.14 8.14 0 0 1 5.389-4.104 8.14 8.14 0 0 1 6.643 1.319c4.465 3.186 5.668 9.266 2.88 13.886"/><path style="fill:#d5ad7d" d="M127.986 33.274 117.12 13.217A25.25 25.25 0 0 0 100.617.65a25.25 25.25 0 0 0-20.346 4.041c-12.318 8.785-15.192 25.954-6.407 38.271l.548.768 31.048 27.799 22.525.617zm-15.829 21.432-24.895-22.29c-2.789-4.62-1.585-10.701 2.88-13.885a8.13 8.13 0 0 1 6.642-1.319 8.14 8.14 0 0 1 5.389 4.103l18.21 33.616z"/><path style="fill:#f3a069" d="M224.829 255.971H31.142a6.836 6.836 0 0 1-6.836-6.836V104.133a6.836 6.836 0 0 1 6.836-6.836H224.83a6.836 6.836 0 0 1 6.836 6.836v145.002a6.837 6.837 0 0 1-6.837 6.836"/><path style="fill:#e27c50" d="M127.986 255.971H31.142a6.836 6.836 0 0 1-6.836-6.836V104.133a6.836 6.836 0 0 1 6.836-6.836h96.844z"/><path style="fill:#956958" d="M234.731 105.741H21.24a6.836 6.836 0 0 1-6.836-6.836V71.643a6.836 6.836 0 0 1 6.836-6.836h213.491a6.836 6.836 0 0 1 6.836 6.836v27.262a6.836 6.836 0 0 1-6.836 6.836"/><path style="fill:#7c5849" d="M126.986 64.807H21.24a6.836 6.836 0 0 0-6.836 6.836v27.262a6.836 6.836 0 0 0 6.836 6.836h105.745z"/><path style="fill:#fcf0d9" d="M231.666 136.056h-78.481V64.807h-50.399v71.249h-78.48v50.399h78.48v69.516h50.399v-69.516h78.481z"/><path style="fill:#f8e0b3" d="M127.986 64.807h-25.2v71.249h-78.48v50.399h78.48v69.516h25.2z"/></svg></div>
        <h2>My Rewards</h2>
        <p>View your points balance</p>
      </router-link>

      <router-link to="/calendar" class="section-card">
        <div class="card-icon"><svg width="50" height="50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" xml:space="preserve"><path style="fill:#eff2fa" d="M485.517 472.276H26.483c-9.751 0-17.655-7.904-17.655-17.655V119.172h494.345V454.62c-.001 9.752-7.905 17.656-17.656 17.656"/><path style="fill:#d7deed" d="M8.828 119.172h494.345v35.31H8.828z"/><path style="fill:#ff6464" d="M503.172 136.828H8.828A8.83 8.83 0 0 1 0 128V75.034a8.83 8.83 0 0 1 8.828-8.828h494.345a8.83 8.83 0 0 1 8.828 8.828V128a8.83 8.83 0 0 1-8.829 8.828"/><path style="fill:#d2555a" d="M503.172 136.828H8.828a8.829 8.829 0 0 1 0-17.656h494.345a8.83 8.83 0 0 1 8.828 8.828 8.83 8.83 0 0 1-8.829 8.828"/><path style="fill:#c7cfe2" d="M432.552 92.69a8.826 8.826 0 0 1-8.828-8.828v-35.31c0-4.879 3.953-8.828 8.828-8.828s8.828 3.948 8.828 8.828v35.31a8.826 8.826 0 0 1-8.828 8.828m44.138 0a8.826 8.826 0 0 1-8.828-8.828v-35.31a8.826 8.826 0 0 1 8.828-8.828 8.826 8.826 0 0 1 8.828 8.828v35.31a8.826 8.826 0 0 1-8.828 8.828m-441.38 0a8.826 8.826 0 0 1-8.828-8.828v-35.31c0-4.879 3.953-8.828 8.828-8.828s8.828 3.948 8.828 8.828v35.31a8.826 8.826 0 0 1-8.828 8.828m353.104 0a8.826 8.826 0 0 1-8.828-8.828v-35.31c0-4.879 3.953-8.828 8.828-8.828s8.828 3.948 8.828 8.828v35.31a8.826 8.826 0 0 1-8.828 8.828m-44.138 0a8.826 8.826 0 0 1-8.828-8.828v-35.31a8.826 8.826 0 0 1 8.828-8.828 8.826 8.826 0 0 1 8.828 8.828v35.31a8.826 8.826 0 0 1-8.828 8.828m-44.138 0a8.826 8.826 0 0 1-8.828-8.828v-35.31c0-4.879 3.953-8.828 8.828-8.828s8.828 3.948 8.828 8.828v35.31a8.826 8.826 0 0 1-8.828 8.828m-44.138 0a8.826 8.826 0 0 1-8.828-8.828v-35.31c0-4.879 3.953-8.828 8.828-8.828s8.828 3.948 8.828 8.828v35.31A8.826 8.826 0 0 1 256 92.69m-44.138 0a8.826 8.826 0 0 1-8.828-8.828v-35.31a8.826 8.826 0 0 1 8.828-8.828 8.826 8.826 0 0 1 8.828 8.828v35.31a8.826 8.826 0 0 1-8.828 8.828m-44.138 0a8.826 8.826 0 0 1-8.828-8.828v-35.31c0-4.879 3.953-8.828 8.828-8.828s8.828 3.948 8.828 8.828v35.31a8.826 8.826 0 0 1-8.828 8.828m-44.138 0a8.826 8.826 0 0 1-8.828-8.828v-35.31a8.826 8.826 0 0 1 8.828-8.828 8.826 8.826 0 0 1 8.828 8.828v35.31a8.826 8.826 0 0 1-8.828 8.828m-44.138 0a8.826 8.826 0 0 1-8.828-8.828v-35.31a8.826 8.826 0 0 1 8.828-8.828 8.826 8.826 0 0 1 8.828 8.828v35.31a8.826 8.826 0 0 1-8.828 8.828"/><path style="fill:#d7deed" d="M97.103 260.414h-35.31a8.83 8.83 0 0 1-8.828-8.828v-17.655a8.83 8.83 0 0 1 8.828-8.828h35.31a8.83 8.83 0 0 1 8.828 8.828v17.655a8.83 8.83 0 0 1-8.828 8.828m0 105.931h-35.31a8.83 8.83 0 0 1-8.828-8.828v-17.655a8.83 8.83 0 0 1 8.828-8.828h35.31a8.83 8.83 0 0 1 8.828 8.828v17.655a8.83 8.83 0 0 1-8.828 8.828m0-52.966h-35.31a8.83 8.83 0 0 1-8.828-8.828v-17.655a8.83 8.83 0 0 1 8.828-8.828h35.31a8.83 8.83 0 0 1 8.828 8.828v17.655a8.83 8.83 0 0 1-8.828 8.828m0 105.931h-35.31a8.83 8.83 0 0 1-8.828-8.828v-17.655a8.83 8.83 0 0 1 8.828-8.828h35.31a8.83 8.83 0 0 1 8.828 8.828v17.655a8.83 8.83 0 0 1-8.828 8.828m70.621-158.896h-35.31a8.83 8.83 0 0 1-8.828-8.828v-17.655a8.83 8.83 0 0 1 8.828-8.828h35.31a8.83 8.83 0 0 1 8.828 8.828v17.655a8.83 8.83 0 0 1-8.828 8.828m0 105.931h-35.31a8.83 8.83 0 0 1-8.828-8.828v-17.655a8.83 8.83 0 0 1 8.828-8.828h35.31a8.83 8.83 0 0 1 8.828 8.828v17.655a8.83 8.83 0 0 1-8.828 8.828m0 52.965h-35.31a8.83 8.83 0 0 1-8.828-8.828v-17.655a8.83 8.83 0 0 1 8.828-8.828h35.31a8.83 8.83 0 0 1 8.828 8.828v17.655a8.83 8.83 0 0 1-8.828 8.828m0-105.931h-35.31a8.83 8.83 0 0 1-8.828-8.828v-17.655a8.83 8.83 0 0 1 8.828-8.828h35.31a8.83 8.83 0 0 1 8.828 8.828v17.655a8.83 8.83 0 0 1-8.828 8.828m70.621-52.965h-35.31a8.83 8.83 0 0 1-8.828-8.828v-17.655a8.83 8.83 0 0 1 8.828-8.828h35.31a8.83 8.83 0 0 1 8.828 8.828v17.655a8.83 8.83 0 0 1-8.828 8.828m0 52.965h-35.31a8.83 8.83 0 0 1-8.828-8.828v-17.655a8.83 8.83 0 0 1 8.828-8.828h35.31a8.83 8.83 0 0 1 8.828 8.828v17.655a8.83 8.83 0 0 1-8.828 8.828m70.621-52.965h-35.31a8.83 8.83 0 0 1-8.828-8.828v-17.655a8.83 8.83 0 0 1 8.828-8.828h35.31a8.83 8.83 0 0 1 8.828 8.828v17.655a8.83 8.83 0 0 1-8.828 8.828m0 52.965h-35.31a8.83 8.83 0 0 1-8.828-8.828v-17.655a8.83 8.83 0 0 1 8.828-8.828h35.31a8.83 8.83 0 0 1 8.828 8.828v17.655a8.83 8.83 0 0 1-8.828 8.828m-70.621 52.966h-35.31a8.83 8.83 0 0 1-8.828-8.828v-17.655a8.83 8.83 0 0 1 8.828-8.828h35.31a8.83 8.83 0 0 1 8.828 8.828v17.655a8.83 8.83 0 0 1-8.828 8.828m70.621 0h-35.31a8.83 8.83 0 0 1-8.828-8.828v-17.655a8.83 8.83 0 0 1 8.828-8.828h35.31a8.83 8.83 0 0 1 8.828 8.828v17.655a8.83 8.83 0 0 1-8.828 8.828m-70.621 52.965h-35.31a8.83 8.83 0 0 1-8.828-8.828v-17.655a8.83 8.83 0 0 1 8.828-8.828h35.31a8.83 8.83 0 0 1 8.828 8.828v17.655a8.83 8.83 0 0 1-8.828 8.828m70.621 0h-35.31a8.83 8.83 0 0 1-8.828-8.828v-17.655a8.83 8.83 0 0 1 8.828-8.828h35.31a8.83 8.83 0 0 1 8.828 8.828v17.655a8.83 8.83 0 0 1-8.828 8.828m70.62-158.896h-35.31a8.83 8.83 0 0 1-8.828-8.828v-17.655a8.83 8.83 0 0 1 8.828-8.828h35.31a8.83 8.83 0 0 1 8.828 8.828v17.655a8.83 8.83 0 0 1-8.828 8.828m0 105.931h-35.31a8.83 8.83 0 0 1-8.828-8.828v-17.655a8.83 8.83 0 0 1 8.828-8.828h35.31a8.83 8.83 0 0 1 8.828 8.828v17.655a8.83 8.83 0 0 1-8.828 8.828m0 52.965h-35.31a8.83 8.83 0 0 1-8.828-8.828v-17.655a8.83 8.83 0 0 1 8.828-8.828h35.31a8.83 8.83 0 0 1 8.828 8.828v17.655a8.83 8.83 0 0 1-8.828 8.828m0-105.931h-35.31a8.83 8.83 0 0 1-8.828-8.828v-17.655a8.83 8.83 0 0 1 8.828-8.828h35.31a8.83 8.83 0 0 1 8.828 8.828v17.655a8.83 8.83 0 0 1-8.828 8.828m70.621-52.965h-35.31a8.83 8.83 0 0 1-8.828-8.828v-17.655a8.83 8.83 0 0 1 8.828-8.828h35.31a8.83 8.83 0 0 1 8.828 8.828v17.655a8.83 8.83 0 0 1-8.828 8.828m0 105.931h-35.31a8.83 8.83 0 0 1-8.828-8.828v-17.655a8.83 8.83 0 0 1 8.828-8.828h35.31a8.83 8.83 0 0 1 8.828 8.828v17.655a8.83 8.83 0 0 1-8.828 8.828m0-52.966h-35.31a8.83 8.83 0 0 1-8.828-8.828v-17.655a8.83 8.83 0 0 1 8.828-8.828h35.31a8.83 8.83 0 0 1 8.828 8.828v17.655a8.83 8.83 0 0 1-8.828 8.828m0 105.931h-35.31a8.83 8.83 0 0 1-8.828-8.828v-17.655a8.83 8.83 0 0 1 8.828-8.828h35.31a8.83 8.83 0 0 1 8.828 8.828v17.655a8.83 8.83 0 0 1-8.828 8.828"/><path style="fill:#c7cfe2" d="M97.103 207.448h-35.31a8.829 8.829 0 0 1 0-17.656h35.31a8.828 8.828 0 0 1 0 17.656m70.621 0h-35.31a8.829 8.829 0 0 1 0-17.656h35.31a8.828 8.828 0 0 1 0 17.656m70.621 0h-35.31a8.829 8.829 0 0 1 0-17.656h35.31a8.829 8.829 0 0 1 0 17.656m70.621 0h-35.31a8.829 8.829 0 0 1 0-17.656h35.31a8.829 8.829 0 0 1 0 17.656m70.62 0h-35.31a8.829 8.829 0 0 1 0-17.656h35.31a8.828 8.828 0 0 1 0 17.656m70.621 0h-35.31a8.829 8.829 0 0 1 0-17.656h35.31a8.829 8.829 0 0 1 0 17.656"/><path style="fill:#ff6464" d="M211.862 251.586a8.8 8.8 0 0 1-6.241-2.586l-17.655-17.655a8.825 8.825 0 0 1 0-12.483 8.825 8.825 0 0 1 12.483 0l11.413 11.415 29.069-29.069c3.448-3.448 9.035-3.448 12.483 0s3.448 9.035 0 12.483l-35.31 35.31a8.8 8.8 0 0 1-6.242 2.585m141.241 52.966a8.8 8.8 0 0 1-6.241-2.586l-17.655-17.655c-3.448-3.448-3.448-9.035 0-12.483s9.035-3.448 12.483 0l11.413 11.415 29.069-29.069a8.825 8.825 0 0 1 12.483 0 8.825 8.825 0 0 1 0 12.483l-35.31 35.31a8.8 8.8 0 0 1-6.242 2.585M141.241 410.483a8.8 8.8 0 0 1-6.241-2.586l-17.655-17.655a8.825 8.825 0 0 1 0-12.483 8.825 8.825 0 0 1 12.483 0l11.413 11.415 29.069-29.069a8.825 8.825 0 0 1 12.483 0 8.825 8.825 0 0 1 0 12.483l-35.31 35.31a8.8 8.8 0 0 1-6.242 2.585"/><path style="fill:#18bdf6" d="M88.276 251.586H70.621a8.829 8.829 0 0 1 0-17.656h17.655a8.829 8.829 0 0 1 0 17.656m353.103 105.931h-17.655a8.829 8.829 0 0 1 0-17.656h17.655a8.828 8.828 0 0 1 0 17.656m-211.862-52.965h-17.655a8.829 8.829 0 0 1 0-17.656h17.655a8.829 8.829 0 0 1 0 17.656"/><path style="fill:#ffd782" d="M300.138 410.483h-17.655a8.829 8.829 0 0 1 0-17.656h17.655a8.829 8.829 0 0 1 0 17.656M158.897 304.552h-17.655a8.829 8.829 0 0 1 0-17.656h17.655a8.83 8.83 0 0 1 8.828 8.828 8.83 8.83 0 0 1-8.828 8.828"/></svg></div>
        <h2>Study Streak</h2>
        <p>View your study streak pictures</p>
      </router-link>      
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import supabase from '../config/supabaseClient'

const username = ref('User')
const reviewCount = ref(0)
const favouriteCount = ref(0)
const totalPoints = ref(0)

onMounted(async () => {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (user) {
    // Get username
    const { data: profile } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .single()
    
    if (profile) username.value = profile.username

    // Get review count
    const { data: reviews } = await supabase
      .from('reviews')
      .select('review_id', { count: 'exact' })
      .eq('user_id', user.id)
    
    reviewCount.value = reviews?.length || 0

    // Get favourite count
    const { data: favourites } = await supabase
      .from('user_favourites')
      .select('id', { count: 'exact' })
      .eq('user_id', user.id)
    
    favouriteCount.value = favourites?.length || 0

    // Get total points
    const { data: points } = await supabase
      .from('points')
      .select('amount')
      .eq('user_id', user.id)
      .eq('is_used', false)
      .gte('expires_at', new Date().toISOString())
    
    totalPoints.value = points?.reduce((sum, p) => sum + p.amount, 0) || 0
  }
})
</script>

<style scoped>
.home-container {
  padding: 40px 80px;
  max-width: 1400px;
  margin: 0 auto;
}

.welcome-section {
  text-align: center;
  margin-bottom: 50px;
}

.welcome-section h1 {
  font-size: 48px;
  color: #fbe8d3;
  margin-bottom: 10px;
  font-weight: bold;
}

.tagline {
  font-size: 20px;
  color: #e7bf8f;
  opacity: 0.9;
}

.quick-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 50px;
}

.stat-card {
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 15px;
  padding: 25px;
  display: flex;
  align-items: center;
  gap: 20px;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
}

.stat-icon {
  font-size: 40px;
}

.stat-info h3 {
  font-size: 32px;
  color: #fbe8d3;
  margin: 0 0 5px 0;
}

.stat-info p {
  font-size: 14px;
  color: #e7bf8f;
  margin: 0;
}

.sections-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 30px;
}

.section-card {
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 15px;
  padding: 40px 30px;
  text-align: center;
  text-decoration: none;
  color: inherit;
  transition: transform 0.3s ease, box-shadow 0.3s ease, background-color 0.3s ease;
}

.section-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 25px rgba(0, 0, 0, 0.3);
  background-color: rgba(255, 255, 255, 0.08);
}

.card-icon {
  font-size: 60px;
  margin-bottom: 20px;
  color: white;
}

.section-card h2 {
  font-size: 24px;
  color: #fbe8d3;
  margin-bottom: 10px;
}

.section-card p {
  font-size: 14px;
  color: #e7bf8f;
  margin: 0;
}

@media (max-width: 768px) {
  .home-container {
    padding: 20px;
  }

  .welcome-section h1 {
    font-size: 32px;
  }

  .sections-grid {
    grid-template-columns: 1fr;
  }
}
</style>
