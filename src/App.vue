<template>
  <v-app>
    <v-main>
      <MainContainer>
        <BetaDialog/>
        <v-snackbar
          :timeout="-1"
          :value="showUpdateUI"
          absolute
          bottom
          right
        >
          New content available. Refresh page now?
          <v-btn text color="primary" small @click="showUpdateUI = false">Close</v-btn>
          <v-btn text color="primary" small @click="updateAndRefreshPage">Refresh</v-btn>
        </v-snackbar>
        <router-view/>
      </MainContainer>
    </v-main>
  </v-app>
</template>

<!--suppress JSUnusedLocalSymbols -->
<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import { Workbox } from 'workbox-window';
import MainContainer from '@/components/MainContainer.vue';
import feathersClient, { AuthObject } from '@/feathers-client';
import EventBus from '@/eventbus';
import BetaDialog from '@/components/BetaDialog.vue';

@Component({
  components: { BetaDialog, MainContainer },
})
export default class App extends Vue {
  private feathersClient = feathersClient;
  private auth: AuthObject | null = null;
  private showUpdateUI = false;

  async mounted (): Promise<void> {
    if (!this.$wb) {
      (this.$wb as Workbox).addEventListener('waiting', () => {
        this.showUpdateUI = true;
      });
    }

    Vue.config.errorHandler = (e) => {
      console.error(e);
      this.$toast.error('Something unexpected just happened!');
    };

    EventBus.$on('toast', this.$toast);

    setTimeout(async () => {
      this.auth = await feathersClient.get('authentication');
      if (!this.auth) return;
      const usr = this.auth.user;

      this.$vuetify.theme.dark = usr.prefersDarkMode;
    }, 500);
  }

  async updateAndRefreshPage (): Promise<void> {
    if (!this.$wb) return;

    await this.$wb.messageSW({ type: 'SKIP_WAITING' });
    window.location.reload();
  }
}
</script>
