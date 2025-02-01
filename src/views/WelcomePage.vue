<template>
  <div
    :style="{ color: theme.current.value.dark ? '#f6f6f6' : '#4d4d4d' }"
    class="d-flex align-center justify-center flex-column ma-auto text-block"
  >
    <div :class="{'text-grey-darken-1': theme.current.value.dark}">
      <h1 :class="{'text-grey': theme.current.value.dark}">
        <span v-if="!auth">
          Welcome!
        </span>
        <span v-else>
          Hello, {{ auth.loginStore.fullName }}!
        </span>
      </h1>

      Busket is a fast, simple web app that was made because of my frustration with digital
      shopping lists. It is fast, works on- and offline, supports sharing and is updated
      frequently. Start digitalizing your shopping list now!
      <br>
      You can get started by either signing up here or by taking a small tutorial around the app.
      <br>
      Have fun organizing your shopping lists!
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, Ref, ref } from 'vue';
import feathersClient, { AuthObject } from '@/feathers-client';
import { useTheme } from 'vuetify';

const auth: Ref<AuthObject | null> = ref(null);
const theme = useTheme();

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
