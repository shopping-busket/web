import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import feathersClient, { AuthObject, FeathersError, User, } from '@/feathers-client';
import app from '@/main';
import { authenticationInjection, userInjection } from '@/helpers/injectionKeys';

export interface RouteMeta {
  requiresAuth?: boolean,
  allowInProduction?: boolean,
}

export type RouteRecordRawWithMeta = RouteRecordRaw & {
  meta?: RouteMeta
}

export enum Route {
  SIGNUP = 'signup',
  LOGIN = 'login',
  EMAIL_VERIFICATION = 'email verification',
  VERIFY_EMAIL = 'verify email',

  MY_LISTS = 'my lists',
  JOIN_LIST = 'join list',
  LIST_NOT_FOUND = 'list not found',
  DISPLAY_LIST = 'display list',

  PREFERENCES = 'preferences',
  HOME = 'home',
  NOT_FOUND = 'not found',
  FEATHERS_TESTING = 'feathersjs backend testing'
}

const routes: RouteRecordRawWithMeta[] = [
  //region authentication
  {
    path: '/signup',
    name: Route.SIGNUP,
    meta: {
      requiresAuth: false,
    },
    component: () => import('../views/auth/SignupPage.vue'),
  },
  {
    path: '/login',
    name: Route.LOGIN,
    meta: {
      requiresAuth: false,
    },
    component: () => import('../views/auth/LoginPage.vue'),
  },
  {
    path: '/email-verification',
    name: Route.EMAIL_VERIFICATION,
    meta: {
      requiresAuth: true,
    },
    component: () => import('../views/auth/EmailVerification.vue'),
  },
  {
    path: '/verify-email',
    name: Route.VERIFY_EMAIL,
    meta: {
      requiresAuth: true,
    },
    component: () => import('../views/auth/VerifyEmail.vue'),
  },
  //endregion authentication

  //region lists
  {
    path: '/me/list/:id/join/:secret/:whitelistId',
    name: Route.JOIN_LIST,
    props: true,
    meta: {
      requiresAuth: true,
    },
    component: () => import('../views/me/list/JoinList.vue'),
  },
  {
    path: '/me/list/:id/not-found',
    name: Route.LIST_NOT_FOUND,
    props: true,
    component: () => import('../views/me/list/ListNotFound.vue'),
  },
  {
    path: '/me/list/:id',
    name: Route.DISPLAY_LIST,
    props: true,
    meta: {
      requiresAuth: true,
    },
    component: () => import('@/views/me/list/DisplayList.vue'),
  },
  {
    path: '/me/lists/:id',
    redirect: (to) => ({
      name: Route.DISPLAY_LIST,
      params: to.params,
    }),
  },
  {
    path: '/me/lists',
    name: Route.MY_LISTS,
    meta: {
      requiresAuth: true,
    },
    component: () => import('../views/me/list/MyLists.vue'),
  },
  {
    path: '/me/list',
    redirect: { name: Route.MY_LISTS },
  },
  //endregion

  //region user
  {
    path: '/me/settings',
    redirect: { name: Route.PREFERENCES },
  },
  {
    path: '/me/preferences',
    name: Route.PREFERENCES,
    meta: {
      requiresAuth: true,
    },
    component: () => import('../views/me/UserPreferences.vue'),
  },
  //endregion

  {
    path: '/feathersjs-backend-tool',
    name: Route.FEATHERS_TESTING,
    meta: {
      requiresAuth: true,
      allowInProduction: false,
    },
    component: () => import('../views/tools/FeathersTesting.vue'),
  },
  {
    path: '/',
    name: Route.HOME,
    meta: {
      requiresAuth: false,
    },
    component: () => import('../views/WelcomePage.vue'),
  },
  {
    path: '/:pathMatch(.*)*',
    name: Route.NOT_FOUND,
    component: () => import('../views/NotFound.vue'),
  }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

let user: User | null = null;
router.beforeEach(async (to, from, next) => {
  console.log('[Router]', to, from);

  const destinationMeta: RouteMeta | null = to.meta;

  // Only allow in dev mode
  if (!destinationMeta?.allowInProduction && process.env.NODE_ENV !== 'development') await router.replace({ name: Route.NOT_FOUND });

  // Authentication
  if (!feathersClient.authentication.authenticated) {
    setTimeout(() => {
      if (feathersClient.io.connected) return;
      // EventBus.$emit('toast', 'Your offline.');
      next();
    }, 800);

    await feathersClient.authenticate().then((authentication) => {
      const auth = authentication as AuthObject;

      app.provide(authenticationInjection, auth);
      app.provide(userInjection, auth.user);
      user = auth.user;
    }).catch((err: FeathersError) => {
      if (err.code === 408) {
        console.log('[Auth] Timeout while trying to authenticate. You are offline!');
        return;
      }
      console.log(`[Auth] Not authenticated. This page requires auth: ${destinationMeta?.requiresAuth ? 'yes' : 'no'}`);
      if (!Array.isArray(err.data) && !err.data?.reason && destinationMeta?.requiresAuth) {
        router.replace({
          name: 'login',
          query: { redirect: to.path },
        });
        return;
      }
    });
  }

  if (feathersClient.authentication.authenticated && destinationMeta?.requiresAuth && to.name !== Route.VERIFY_EMAIL && !user?.verifiedEmail) await router.replace({ name: Route.VERIFY_EMAIL });
  next();
});

export default router;
