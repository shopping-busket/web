<template>
  <v-app>
    <v-main>
      <MainContainer>
        <router-view/>
      </MainContainer>
    </v-main>
  </v-app>
</template>

<!--suppress JSUnusedLocalSymbols -->
<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import { POSITION } from 'vue-toastification';
import MainContainer from '@/components/MainContainer.vue';
import feathersClient from '@/feathers-client';
import EventBus from '@/eventbus';

@Component({
  components: { MainContainer },
})
export default class App extends Vue {
  private feathersClient = feathersClient;

  mounted (): void {
    Vue.config.errorHandler = (e) => {
      console.error(e);
      this.$toast.error('Something unexpected just happened!', {
        position: POSITION.TOP_RIGHT,
        timeout: 2222,
        closeOnClick: true,
        pauseOnFocusLoss: true,
        pauseOnHover: true,
        draggable: true,
        draggablePercent: 0.6,
        closeButton: 'button',
        icon: true,
      });
    };

    EventBus.$on('toast', this.$toast);
  }
}
</script>
