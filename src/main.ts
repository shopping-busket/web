import Vue from 'vue';
import Toast from 'vue-toastification';
import 'vue-toastification/dist/index.css';
import { Workbox } from 'workbox-window';
import App from './App.vue';
import router from './router';
import vuetify from './plugins/vuetify';
import 'roboto-fontface/css/roboto/roboto-fontface.css';
import '@mdi/font/css/materialdesignicons.css';
import i18n from './i18n';
import wb from './registerServiceWorker';

declare module 'vue/types/vue' {
  interface Vue {
    $wb: Workbox
  }
}

Vue.prototype.$wb = wb;

Vue.config.productionTip = false;

Vue.use(Toast, {
  transition: 'Vue-Toastification__bounce',
  maxToasts: 20,
  timeout: 1800,
  newestOnTop: true,
});

new Vue({
  vuetify,
  router,
  i18n,
  render: (h) => h(App),
}).$mount('#app');
