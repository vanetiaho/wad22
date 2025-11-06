import './assets/style.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './route/routes'

import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { library } from '@fortawesome/fontawesome-svg-core'
import { fas } from '@fortawesome/free-solid-svg-icons'
import { far } from '@fortawesome/free-regular-svg-icons'
import { fab } from '@fortawesome/free-brands-svg-icons'

library.add(fas, far, fab)


const app = createApp(App)
app.use(router)


app.component('FontAwesomeIcon', FontAwesomeIcon)

app.mount('#app')