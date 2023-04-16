<template>
  <div class="w-100 pa-16">
    <v-card
      variant="outlined"
      max-width="500px"
      class="ma-auto"
      :title="route.query.expired ? 'Email verification failed!' : 'Email verification successful!'"
    >
      <v-card-text>
        <span v-if="route.query.expired">
          The link you used to verify your email has already expired. We sent you a new email with a new verification link!
        </span>
        <span v-else>
          You successfully verified your email. You can now start creating lists and using Busket in your day-to-day life!
        </span>
      </v-card-text>
      <v-card-actions>
        <v-btn block color="primary" variant="tonal" :to="{ name: Route.MY_LISTS }">
          Ok
        </v-btn>
      </v-card-actions>
    </v-card>
  </div>
</template>

<script lang="ts" setup>
import { VBtn, VCard, VCardActions, VCardText } from 'vuetify/components';
import { Route } from '@/router';
import { useRoute } from 'vue-router';

const route = useRoute();
</script>
