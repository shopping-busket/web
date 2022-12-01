import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import feathersClient, { FeathersError } from '@/feathers-client';

type RouteRecordRawWithMeta = RouteRecordRaw & {
  meta?: {
    requiresAuth?: boolean,
  },
}

const routes: Array<RouteRecordRawWithMeta> = [
  {
    path: '/',
    name: 'home',
    meta: {
      requiresAuth: false,
    },
    component: () => import('@/views/WelcomePage.vue'),
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not found',
    component: () => import('@/views/NotFound.vue'),
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
