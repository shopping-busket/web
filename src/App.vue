<template>
  <v-app>
    <v-main>
      <MainContainer>
        <v-snackbar
          :timeout="-1"
          :value="showUpdateUI"
          absolute
          bottom
          right
        >
          New content available. Refresh page now?
          <v-btn color="primary" small variant="text" @click="showUpdateUI = false">
            Close
          </v-btn>
          <v-btn color="primary" small variant="text" @click="updateAndRefreshPage">
            Refresh
          </v-btn>
        </v-snackbar>
        <AuthenticationLoading v-if="routeLoading" />
        <router-view v-else />
      </MainContainer>
    </v-main>
  </v-app>
</template>

<script lang="ts" setup>
import { VApp, VBtn, VMain, VSnackbar } from 'vuetify/components';

import { Workbox } from 'workbox-window';
import feathersClient, { AuthObject } from '@/feathers-client';
import { inject, onMounted, ref } from 'vue';
import { useToast } from 'vue-toastification';
import { useTheme } from 'vuetify';
import app from '@/main';
import MainContainer from '@/components/MainContainer.vue';
import AuthenticationLoading from '@/views/auth/AuthenticationLoading.vue';
import emitter from '@/helpers/mitt';
import { useRoute, useRouter } from 'vue-router';

const showUpdateUI = ref(true);
const theme = useTheme();
const router = useRouter();
const route = useRoute();
const wb = inject('wb') as Workbox;
const routeLoading = ref(false);

let auth: AuthObject | null = null;

onMounted(async () => {
  emitter.on('navGuardLoading', (loading) => {
    console.log(`navGuardLoading: ${loading}`);
    routeLoading.value = loading;
  });

  if (wb) {
    (wb as Workbox).addEventListener('waiting', () => {
      showUpdateUI.value = true;
    });
  }

  app.config.errorHandler = async (e) => {
    (window as unknown as { e: unknown }).e = e;
    if (Object.prototype.hasOwnProperty.call(e, 'code') && e.code === 401) {
      console.log('Error caught by global App.vue errorhandler: NotAuthenticated. Redirecting to login');
      console.error(e);
      await feathersClient.authenticate().catch(async () => await router.push({ name: 'login', query: { redirect: route.path } }));
      return;
    }
    console.log(JSON.stringify(e, null, 2));
    console.error(e);
    useToast().error('Something unexpected just happened!');
  };

  setTimeout(async () => {
    auth = await feathersClient.get('authentication');
    if (!auth) return;
    const usr = auth.user;

    theme.global.name.value = usr.prefersDarkMode ? 'darkTheme' : 'lightTheme';
  }, 500);

  if (process.env.NODE_ENV === 'development') document.title = 'Busket Dev';
});

async function updateAndRefreshPage(): Promise<void> {
  if (!wb) return;

  await wb.messageSW({ type: 'SKIP_WAITING' });
  window.location.reload();
}
</script>

<style>
/*noinspection ALL*/
.v-card-subtitle {
  white-space: normal;
}
</style>
