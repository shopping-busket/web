import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import feathersClient, { AuthObject, FeathersError } from '@/feathers-client';
import app from '@/main';
import { authenticationInjection, userInjection } from '@/helpers/injectionKeys';

type RouteRecordRawWithMeta = RouteRecordRaw & {
  meta?: {
    requiresAuth?: boolean,
  },
}

export enum Route {
  SIGNUP = 'signup',
  LOGIN = 'login',
  MY_LISTS = 'my lists',
  JOIN_LIST = 'join list',
  LIST_NOT_FOUND = 'list not found',
  DISPLAY_LIST = 'display list',
  PREFERENCES = 'preferences',
  HOME = 'home',
  NOT_FOUND = 'not found',
}

const routes: Array<RouteRecordRawWithMeta> = [
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

router.beforeEach(async (to, from, next) => {
  console.log('[Router]', to, from);

  // Authentication
  if (!feathersClient.authentication.authenticated) {
    setTimeout(() => {
      if (feathersClient.io.connected) return;
      // EventBus.$emit('toast', 'Your offline.');
      next();
    }, 800);

    await feathersClient.authenticate().then((authentication) => {
        app.provide(authenticationInjection, authentication as AuthObject);
        app.provide(userInjection, (authentication as AuthObject).user);
    }).catch((err: FeathersError) => {
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
        return;
      }
    });
  }
  next();
});

export default router;
