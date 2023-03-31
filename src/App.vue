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
        <router-view />
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

const showUpdateUI = ref(true);
const theme = useTheme();
const wb = inject('wb') as Workbox;

let auth: AuthObject | null = null;

onMounted(() => {
  if (wb) {
    (wb as Workbox).addEventListener('waiting', () => {
      showUpdateUI.value = true;
    });
  }

  app.config.errorHandler = (e) => {
    console.error(e);
    useToast().error('Something unexpected just happened!');
  };

  setTimeout(async () => {
    auth = await feathersClient.get('authentication');
    if (!auth) return;
    const usr = auth.user;

    theme.global.name.value = usr.prefersDarkMode ? 'darkTheme' : 'lightTheme';
  }, 500);
});

async function updateAndRefreshPage(): Promise<void> {
  if (!wb) return;

  await wb.messageSW({ type: 'SKIP_WAITING' });
  window.location.reload();
}
</script>
