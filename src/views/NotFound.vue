<template>
  <div
    style="font-family: 'Poppins', sans-serif; max-width: 800px; height: calc(100vh - 63px)"
    class="d-flex justify-center align-center flex-column ma-auto"
  >
    <div class="text-center">
      <div class="header">
        404
      </div>
      <div class="text-subtitle-1">
        Page not found.
      </div>
      <p>This page doesn't seem to exist on our servers.</p>
      <v-btn class="mt-1" variant="outlined" color="primary" block @click="$router.push({ name: 'home' })">
        Go home
      </v-btn>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { VBtn } from 'vuetify/components';
</script>

<style lang="scss" scoped>
.text-subtitle-1 {
  color: #8c8c8c;
}

p {
  margin-top: 10px;
  color: #3b3b3b;
}

.header {
  color: #3b3b3b;
  font-size: 7rem;
  line-height: 6rem;
}
</style>
