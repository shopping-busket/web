import Vue from 'vue';
import VueRouter, { RouteConfig } from 'vue-router';
import Home from '../views/Home.vue';

Vue.use(VueRouter);

const routes: Array<RouteConfig> = [
  {
    path: '/',
    name: 'Home',
    component: Home,
  },
  {
    path: '/palettes',
    name: 'Color palette tool',
    component: () => import(/* webpackChunkName: "ColorPalette" */ '../views/ColorPalette.vue'),
  },
  {
    path: '/github',
    name: 'github',
    beforeEnter (): void {
      window.open('https://github.com/shopping-busket/');
    },
  },
  {
    path: '*',
    name: '404',
    component: () => import(/* webpackChunkName: "404" */ '../views/Home.vue'),
  },
];

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes,
});

export default router;
