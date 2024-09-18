<template>
  <div class="w-100 pa-16">
    <v-card
      variant="outlined"
      max-width="500px"
      class="ma-auto"
      title="Verify Email"
      :text="`Please verify your email using the link we sent you to ${user?.email ?? 'error'}! You cannot access this page without verifying first.`"
    >
      <v-card-actions>
        <v-btn block color="primary" variant="tonal" :to="{ name: Route.HOME }">
          Ok
        </v-btn>
      </v-card-actions>
    </v-card>
  </div>
</template>

<script lang="ts" setup>
import { VBtn, VCard, VCardActions } from 'vuetify/components';
import { Route } from '@/router';
import { inject } from 'vue';
import { userInjection } from '@/helpers/injectionKeys';

const user = inject(userInjection);
</script>
