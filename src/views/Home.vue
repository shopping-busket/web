<template>
  <div class="d-flex align-center justify-center flex-column"
       style="width: 800px; height: calc(100% - 110px); margin: auto; font-family: 'Poppins', sans-serif; font-weight: 400;"
  :style="{ color: $vuetify.theme.dark ? '#f6f6f6' : '#4d4d4d' }"
  >
    <h1 v-if="!!auth">Hello, {{ auth.user.fullName }}!</h1>
    <h1 v-else>Hello!</h1>
    Welcome to Busket.
    Busket is a fast, simple application that was made because of my frustration with some mobile
    shopping lists I've tried. It is fast, works online and offline, supports sharing and gets
    frequent updates. Start digitalizing your shopping list now!

    You can get started by either signing up here or by taking a small tutorial around the app.

    Have fun shopping!
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import MainContainer from '@/components/MainContainer.vue';
import feathersClient from '@/feathers-client';

@Component({
  components: {
    MainContainer,
  },
})
export default class Home extends Vue {
  private auth = null;

  async mounted (): Promise<void> {
    this.auth = await feathersClient.get('authentication');
  }
}
</script>
