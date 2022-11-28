import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import feathersClient from '@/feathers-client';

type RouteRecordRawWithMeta = RouteRecordRaw & {
  meta?: {
    requiresAuth?: boolean,
  },
}

const routes: Array<RouteRecordRawWithMeta> = [
  /* {
    path: '/me/list/:id',
    name: 'list details',
    props: true,
    meta: {
      requiresAuth: true,
    },
    component: () => import(/!* webpackChunkName: "List details" *!/ '@/views/Me/List/Details.vue'),
  },
  {
    path: '/me/lists',
    name: 'my lists',
    meta: {
      requiresAuth: true,
    },
    component: () => import(/!* webpackChunkName: "My lists" *!/ '@/views/Me/List/MyLists.vue'),
  },
  {
    path: '/me/list',
    redirect: { name: 'my lists' },
  },
  {
    path: '/signup',
    name: 'signup',
    meta: {
      requiresAuth: false,
    },
    component: () => import(/!* webpackChunkName: "SignupPage" *!/ '@/views/Auth/SignupPage.vue'),
  },
  {
    path: '/login',
    name: 'login',
    meta: {
      requiresAuth: false,
    },
    component: () => import(/!* webpackChunkName: "ColorPalette" *!/ '@/views/Auth/LoginPage.vue'),
  },
  {
    path: '/me/preferences',
    name: 'preferences',
    meta: {
      requiresAuth: false,
    },
    component: () => import(/!* webpackChunkName: "Preferences" *!/ '@/views/Me/Preferences.vue'), // TODO: Actually make prefs
  },
  {
    path: '/about',
    name: 'about',
    meta: {
      requiresAuth: false,
    },
    component: () => import(/!* webpackChunkName: "ColorPalette" *!/ '@/views/About.vue'), // TODO: Actually make about
  },
  {
    path: '/palettes',
    name: 'color palette',
    meta: {
      requiresAuth: false,
    },
    component: () => import(/!* webpackChunkName: "ColorPalette" *!/ '@/views/ColorPalette.vue'),
  },
  {
    path: '/github',
    name: 'github',
    meta: {
      requiresAuth: false,
    },
    beforeEnter(): void {
      window.open('https://github.com/shopping-busket/');
    },
    redirect: '',
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
    path: '/:pathMatch(.*)*',
    name: '404',
    component: () => import(/!* webpackChunkName: "404" *!/ '@/views/NotFound.vue'),
  }, */
  {
    path: '/',
    name: 'home',
    meta: {
      requiresAuth: false,
    },
    component: () => import(/* webpackChunkName: "home" */ '@/App.vue'),
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

router.beforeEach(async (to, from, next) => {
  console.log('[Router]', to, from);

  // Authentication
  if (!feathersClient.authentication.authenticated) {
    setTimeout(() => {
      if (feathersClient.io.connected) return;
      // EventBus.$emit('toast', 'Your offline.');
      next();
    }, 800);

    await feathersClient.authenticate()
      .catch((err) => {
        if (err.code === 408) {
          console.log('[Auth] Timeout while trying to authenticate. You are offline!');
          return;
        }
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
});

export default router;
