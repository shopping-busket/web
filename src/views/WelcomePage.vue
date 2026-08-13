<template>
  <div class="d-flex align-center justify-center flex-column ma-auto h-100">
    <div>
      <div class="text-block">
        <h1>
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

      <div v-if="authStore.isLoggedIn">
        <v-btn color="primary" variant="flat" block text="To my lists"
               @click="$router.push({ name: Route.MY_LISTS })"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {useAuthStore} from "@/stores/auth.store";
import {Route} from "@/router";

const authStore = useAuthStore();
</script>

<style scoped>
.text-block {
  height: 100%;
  max-width: 800px;
  font-family: 'Poppins', sans-serif;
  font-weight: 400;
}
</style>
