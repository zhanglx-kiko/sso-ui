import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

// 1. 引入 Element Plus 核心库
import ElementPlus from 'element-plus'
// 2. 引入 Element Plus 的全局样式文件
import 'element-plus/dist/index.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)
// 3. 全局挂载 Element Plus
app.use(ElementPlus)

app.mount('#app')
