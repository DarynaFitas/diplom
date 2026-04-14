import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { vReveal } from './utils/reveal'
import './style.css'

const app = createApp(App)
app.directive('reveal', vReveal)
app.use(router).mount('#app')
