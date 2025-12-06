import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router';
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import { createPinia } from 'pinia'
import zhCn from 'element-plus/es/locale/lang/zh-cn'


const app = createApp(App);
const pinia = createPinia();
app.use(pinia) // 关键步骤：安装 Pinia
app.use(router);
app.use(ElementPlus, {
  locale: zhCn,   // 所有组件用中文
})
app.mount('#app');