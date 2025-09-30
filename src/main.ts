import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router';
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import { createPinia } from 'pinia'

const app = createApp(App);
const pinia = createPinia();
app.use(router);
app.mount('#app');
app.use(ElementPlus) // 全局注册所有组件
app.use(pinia) // 关键步骤：安装 Pinia