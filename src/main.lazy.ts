import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import {initializeOidc, login} from "@/plugins/auth/oidc.ts";

(async () => {
    const oidc = await initializeOidc()

    if (!oidc.isUserLoggedIn) {
        await login()
    }
    const app = createApp(App)

    app.use(router)

    app.mount('#app')
})()