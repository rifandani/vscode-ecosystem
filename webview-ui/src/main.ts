import { createApp } from 'vue'
import PrimeVue from 'primevue/config'

// @ts-expect-error weird
import App from './App.vue'

// import 'primevue/resources/themes/lara-light-green/theme.css'
// @ts-expect-error it's javascript entry file
import Wind from './presets/wind'
import './main.css'

const app = createApp(App)

app.use(PrimeVue, {
  unstyled: true,
  pt: Wind,
})
app.mount('#app')
