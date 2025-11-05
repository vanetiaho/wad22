import './assets/style.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './route/routes'

// --- Font Awesome setup ---
// import { library } from '@fortawesome/fontawesome-svg-core'
// import { fas } from '@fortawesome/free-solid-svg-icons'
// import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

// import {
// 	faMagnifyingGlass,
// 	faAngleDown,
// } from "@fortawesome/free-solid-svg-icons";

// // Add icons to the library
// library.add(faMagnifyingGlass, faAngleDown);

import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { library } from '@fortawesome/fontawesome-svg-core'
import { fas } from '@fortawesome/free-solid-svg-icons'
import { far } from '@fortawesome/free-regular-svg-icons'
import { fab } from '@fortawesome/free-brands-svg-icons'

library.add(fas, far, fab)


const app = createApp(App)
app.use(router)

// Register Font Awesome component globally
app.component('FontAwesomeIcon', FontAwesomeIcon)

app.mount('#app')