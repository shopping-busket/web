<template>
  <div
    :style="{ color: theme.current.value.dark ? '#f6f6f6' : '#4d4d4d' }"
    class="d-flex align-center justify-center flex-column ma-auto text-block"
  >
    <div :class="{'text-grey-darken-1': theme.current.value.dark}">
      <h1 :class="{'text-grey': theme.current.value.dark}">
        <span v-if="!authStore.isLoggedIn">
          Welcome!
        </span>
        <span v-else>
          Hello, {{ authStore.user?.fullName }}!
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
import {useTheme} from 'vuetify';
import {useAuthStore} from "@/stores/auth.store";

const theme = useTheme();
const authStore = useAuthStore();
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
