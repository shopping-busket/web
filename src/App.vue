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
          <v-btn color="primary" small text @click="showUpdateUI = false">
            Close
          </v-btn>
          <v-btn color="primary" small text @click="updateAndRefreshPage">
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

const showUpdateUI = ref(true);
const theme = useTheme();
const wb = inject('wb') as Workbox;
const routeLoading = ref(false);

let auth: AuthObject | null = null;

onMounted(() => {
  emitter.on('navGuardLoading', (loading) => {
    console.log(`navGuardLoading: ${loading}`);
    routeLoading.value = loading;
  });

  if (wb) {
    (wb as Workbox).addEventListener('waiting', () => {
      showUpdateUI.value = true;
    });
  }

  app.config.errorHandler = (e) => {
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
