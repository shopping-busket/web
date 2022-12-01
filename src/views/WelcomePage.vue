<template>
  <div
    class="d-flex align-center justify-center flex-column ma-auto text-block"
    :style="{ color: $vuetify.theme.dark ? '#f6f6f6' : '#4d4d4d' }"
  >
    <div>
      <h1 v-if="!!auth">
        Hello, {{ auth.user.fullName }}!
      </h1>
      <h1 v-else>
        Hello!
      </h1>
      Welcome to Busket.
      Busket is a fast, simple application that was made because of my frustration with some mobile
      shopping lists I've tried. It is fast, works online and offline, supports sharing and gets
      frequent updates. Start digitalizing your shopping list now!

      You can get started by either signing up here or by taking a small tutorial around the app.

      Have fun shopping!
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, Ref, ref } from 'vue';
import feathersClient, { AuthObject } from '@/feathers-client';

const auth: Ref<AuthObject | null> = ref(null);
onMounted(async () => {
  auth.value = await feathersClient.get('authentication');
});
</script>

<style scoped>
.text-block {
  height: 100%;
  padding-left: 10px;
  padding-right: 10px;
  max-width: 800px;
  font-family: 'Poppins', sans-serif;
  font-weight: 400;
}
</style>
