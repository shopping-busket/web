<template>
  <v-app>
    <v-main>
      <MainContainer>
        <BetaDialog/>
        <router-view/>
      </MainContainer>
    </v-main>
  </v-app>
</template>

<!--suppress JSUnusedLocalSymbols -->
<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
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

  async mounted (): Promise<void> {
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
}
</script>
