import './assets/style.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './route/routes'

// --- Font Awesome setup ---
import { library } from '@fortawesome/fontawesome-svg-core'
import { fas } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

import {
	faMagnifyingGlass,
	faAngleDown,
} from "@fortawesome/free-solid-svg-icons";

// Add icons to the library
library.add(faMagnifyingGlass, faAngleDown);

const app = createApp(App)
app.use(router)

// Register Font Awesome component globally
app.component('FontAwesomeIcon', FontAwesomeIcon)

app.mount('#app')