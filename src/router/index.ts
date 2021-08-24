import Vue from 'vue';
import VueRouter, { RouteConfig } from 'vue-router';
import Home from '@/views/Home.vue';
import feathersClient from '@/feathers-client';
import EventBus from '@/eventbus';

Vue.use(VueRouter);

const routes: Array<RouteConfig> = [
  {
    path: '/me/list/:id',
    name: 'list details',
    props: true,
    meta: {
      requiresAuth: true,
    },
    component: () => import(/* webpackChunkName: "List details" */ '@/views/Me/List/Details.vue'),
  },
  {
    path: '/me/lists',
    name: 'my lists',
    meta: {
      requiresAuth: true,
    },
    component: () => import(/* webpackChunkName: "My lists" */ '@/views/Me/List/MyLists.vue'),
  },
  {
    path: '/signup',
    name: 'signup',
    meta: {
      requiresAuth: false,
    },
    component: () => import(/* webpackChunkName: "SignupPage" */ '@/views/Auth/SignupPage.vue'),
  },
  {
    path: '/login',
    name: 'login',
    meta: {
      requiresAuth: false,
    },
    component: () => import(/* webpackChunkName: "ColorPalette" */ '@/views/Auth/LoginPage.vue'),
  },
  {
    path: '/me/preferences',
    name: 'preferences',
    meta: {
      requiresAuth: false,
    },
    component: () => import(/* webpackChunkName: "Preferences" */ '@/views/Me/Preferences.vue'), // TODO: Actually make prefs
  },
  {
    path: '/about',
    name: 'about',
    meta: {
      requiresAuth: false,
    },
    component: () => import(/* webpackChunkName: "ColorPalette" */ '@/views/About.vue'), // TODO: Actually make about
  },
  {
    path: '/palettes',
    name: 'color palette',
    meta: {
      requiresAuth: false,
    },
    component: () => import(/* webpackChunkName: "ColorPalette" */ '@/views/ColorPalette.vue'),
  },
  {
    path: '/github',
    name: 'github',
    meta: {
      requiresAuth: false,
    },
    beforeEnter (): void {
      window.open('https://github.com/shopping-busket/');
    },
  },
  {
    path: '/',
    name: 'home',
    meta: {
      requiresAuth: false,
    },
    component: Home,
  },
  {
    path: '*',
    name: '404',
    component: () => import(/* webpackChunkName: "404" */ '@/views/NotFound.vue'),
  },
];

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes,
});

router.beforeEach(async (to, from, next) => {
  console.log('[Router]', to, from);

  // Authentication
  if (!feathersClient.authentication.authenticated) {
    setTimeout(() => {
      if (feathersClient.io.connected) return;
      if (to.meta?.requiresAuth) return;
      EventBus.$emit('toast', 'Your offline.');
    }, 800);

    await feathersClient.authenticate().catch((err) => {
      console.log(`[Auth] Not authenticated. This page requires auth: ${to.meta?.requiresAuth ? 'yes' : 'no'}`);
      if (!err.data?.reason && to.meta?.requiresAuth) {
        router.replace({
          name: 'login',
          query: { redirect: to.path },
        });
      }
    });
  }
  next();
  // // Auth
  // if (!(to.meta as Meta).requiresAuth) {
  //   next();
  //   return;
  // }
  //
  // // TODO: Check if logged in. If not, log in
  // await feathersClient.authenticate().then((user) => {
  //   console.log(user);
  //   feathersClient.authentication.app.set('auth', user);
  //   next();
  // }).catch((err) => {
  //   if (!err.data?.reason && to.meta?.requiresAuth) {
  //     console.log(`%c[Auth]%cNot authenticated. This page requires auth: ${(to.meta as Meta).requiresAuth ? 'yes' : 'no'}`, 'color: green');
  //     router.replace({
  //       name: 'login',
  //       query: { redirect: to.path },
  //     });
  //   }
  // });
  // window.location.href = `/login?redirect=${encodeURI(to.fullPath)}`;
});

export default router;
