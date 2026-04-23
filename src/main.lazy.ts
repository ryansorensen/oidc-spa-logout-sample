import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import {initializeOidc} from "@/plugins/auth/oidc.ts";

(async () => {
    await initializeOidc()

    const app = createApp(App)

    app.use(router)

    app.mount('#app')
})()