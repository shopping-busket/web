import { createApp } from 'vue';
import Toast from 'vue-toastification';
import 'vue-toastification/dist/index.css';
import App from './App.vue';
import router from './router';
import vuetify from './plugins/vuetify';
import 'vuetify/styles';
import 'roboto-fontface/css/roboto/roboto-fontface.css';
import '@mdi/font/css/materialdesignicons.css';
import './style.scss';
import i18n from './i18n';
import wb from './registerServiceWorker';
import { createPinia } from 'pinia';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';

const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);

const app = createApp(App);
app.use(router);

app.use(pinia);
app.use(i18n);
app.use(vuetify);
app.use(Toast, {
  transition: 'Vue-Toastification__bounce',
  maxToasts: 20,
  timeout: 1800,
  newestOnTop: true,
});

router.isReady().then(() => {
  app.mount('#app');
});

app.provide('wb', wb);

export default app;
