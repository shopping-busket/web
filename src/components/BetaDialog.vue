<template>
  <v-dialog v-model="dialogOpen" max-width="550px">
    <v-card>
      <v-card-title>Busket v2 beta</v-card-title>
      <v-card-subtitle>Busket version: {{ config.version }}</v-card-subtitle>
      <v-card-text>
        You are currently on the Busket v2 beta. This update channel is not stable. There will be
        many things that don't work/aren't available yet on this release.
        You don't wanna try the beta? <a :href="config.stableURI">Bring me to Busket v1</a>
        <div class="font-weight-bold">
          Note: You may loose lists with updates. We encourage you to download your lists every few weeks if you don't wanna loose them.
        </div>
      </v-card-text>
      <v-card-actions>
        <a @click="dontShowAgain" class="ml-1 mb-1">Don't show me this again!</a>
        <v-spacer></v-spacer>
        <v-btn outlined color="primary" class="mb-1" @click="dialogOpen = false">Dismiss</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import config from '../../config';

@Component
export default class BetaDialog extends Vue {
  private dialogOpen = false;
  private config = config;

  mounted (): void {
    let storage = localStorage.getItem('betaNotice');
    if (!storage) {
      localStorage.setItem('betaNotice', (+true).toString());
      storage = (+true).toString();
    }

    if (parseInt(storage, 0)) {
      this.dialogOpen = true;
    }
  }

  dontShowAgain (): void {
    localStorage.setItem('betaNotice', (+false).toString());
    this.dialogOpen = false;
  }
}
</script>
