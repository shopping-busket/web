import {
  createRouter,
  createWebHistory,
  NavigationGuardNext,
  RouteLocationNormalizedGeneric,
  RouteRecordRaw
} from 'vue-router';
import feathersClient from '@/feathers-client';
import { useToast } from 'vue-toastification';
import emitter from '@/helpers/mitt';

export interface RouteMeta {
  requiresAuth?: boolean,
  requireConnection?: boolean,
  allowInProduction?: boolean,
  allowUnverified?: boolean,
}

export type RouteRecordRawWithMeta = RouteRecordRaw & {
  meta?: RouteMeta
}

export enum Route {
  SIGNUP = 'signup',
  LOGIN = 'login',
  EMAIL_VERIFICATION = 'email verification',
  EMAIL_VERIFY = 'email verify',

  MY_LISTS = 'my lists',
  JOIN_LIST = 'join list',
  LIST_NOT_FOUND = 'list not found',
  DISPLAY_LIST = 'display list',

  MY_RECIPES = 'my recipes',
  DISPLAY_RECIPE = 'display recipe',

  PREFERENCES = 'preferences',
  HOME = 'home',
  NOT_FOUND = 'not found',
  GITHUB = 'github',
  FEATHERS_TESTING = 'feathersjs backend testing',

  NO_CONNECTION = 'no connection',
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
    path: '/email-verify',
    name: Route.EMAIL_VERIFY,
    meta: {
      requiresAuth: true,
      allowUnverified: true,
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

  //region recipes
  {
    path: '/me/recipes',
    name: Route.MY_RECIPES,
    meta: {
      requireConnection: true,
    },
    component: () => import('../views/me/recipes/MyRecipes.vue'),
  },
  {
    path: '/me/recipe/:id',
    name: Route.DISPLAY_RECIPE,
    meta: {
      requireConnection: true,
    },
    props(r) {
      return {
        id: Number.parseInt(r.params.id as string),
      };
    },
    component: () => import('../views/me/recipes/DisplayRecipe.vue'),
  },
  //endregion

  //region loginStore
  {
    path: '/me/settings',
    redirect: { name: Route.PREFERENCES },
  },
  {
    path: '/me/preferences',
    name: Route.PREFERENCES,
    meta: {
      requiresAuth: true,
      allowUnverified: true,
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
    path: '/no-connection',
    name: Route.NO_CONNECTION,
    component: () => import('../views/NoConnection.vue'),
  },
  {
    path: '/github',
    name: Route.GITHUB,
    redirect: '',
    beforeEnter() {
      window.location.replace('https://github.com/shopping-busket');
    }
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

export async function tryAuth(
  from: RouteLocationNormalizedGeneric,
  to: RouteLocationNormalizedGeneric,
  next: NavigationGuardNext,
  destinationMeta: RouteMeta | null,
): Promise<void> {
  emitter.emit('navGuardLoading', false);
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

const toast = useToast();
router.beforeEach(async (to, from, next) => {
  console.log('[Router]', to, from);
  emitter.emit('navGuardLoading', true);

  const destinationMeta: RouteMeta | null = to.meta;

  // Only allow in dev mode
  if (destinationMeta?.allowInProduction === false && process.env.NODE_ENV !== 'development') {
    emitter.emit('navGuardLoading', false);
    await router.replace({ name: Route.NOT_FOUND });
  }

  // Authentication
  if (!feathersClient.authentication.authenticated) {
    if (!destinationMeta.requireConnection) {
      if (!feathersClient.io.connected) {
        console.log('[Auth] destinationMeta.requireConnection = false & feathersClient.io.connected = false');

        next();
        setTimeout(async () => {
          console.log('Trying lazy login ...');
          await tryAuth(from, to, next, destinationMeta);
        }, 200);
        return;
      }
    }

    await tryAuth(from, to, next, destinationMeta);
  }

  emitter.emit('navGuardLoading', false);
  // if (feathersClient.authentication.authenticated && destinationMeta?.requiresAuth && !destinationMeta.allowUnverified) await router.replace({ name: Route.EMAIL_VERIFY });
  next();
});

export default router;
