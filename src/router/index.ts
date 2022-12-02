import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import feathersClient, { FeathersError } from '@/feathers-client';

type RouteRecordRawWithMeta = RouteRecordRaw & {
  meta?: {
    requiresAuth?: boolean,
  },
}

export enum ROUTE {
  SIGNUP = 'signup',
  LOGIN = 'login',
  PREFERENCES = 'preferences',
  HOME = 'home',
  NOT_FOUND = 'not found',
}

const routes: Array<RouteRecordRawWithMeta> = [
  //region authentication
  {
    path: '/signup',
    name: ROUTE.SIGNUP,
    meta: {
      requiresAuth: false,
    },
    component: () => import('../views/auth/SignupPage.vue'),
  },
  {
    path: '/login',
    name: ROUTE.LOGIN,
    meta: {
      requiresAuth: false,
    },
    component: () => import('../views/auth/LoginPage.vue'),
  },
  //endregion authentication

  //region user
  {
    path: '/me/settings',
    redirect: { name: ROUTE.PREFERENCES },
  },
  {
    path: '/me/preferences',
    name: ROUTE.PREFERENCES,
    meta: {
      requiresAuth: false,
    },
    component: () => import('../views/me/UserPreferences.vue'),
  },
  //endregion

  {
    path: '/',
    name: ROUTE.HOME,
    meta: {
      requiresAuth: false,
    },
    component: () => import('../views/WelcomePage.vue'),
  },
  {
    path: '/:pathMatch(.*)*',
    name: ROUTE.NOT_FOUND,
    component: () => import('../views/NotFound.vue'),
  }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
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
      .catch((err: FeathersError) => {
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
