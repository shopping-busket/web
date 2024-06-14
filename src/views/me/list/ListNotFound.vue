<template>
  <div class="pt-16">
    <v-card
      :text="`The requested list with id ${props.id} was not found in our database or you don't have sufficient permissions to access it. Should the problem persist please contact us.`"
      class="ma-auto"
      max-width="500px"
      title="List not found"
      variant="outlined"
    >
      <v-card-actions>
        <v-btn block color="primary" elevation="0" variant="elevated"
               @click="router.push({ name: Route.MY_LISTS })"
        >
          Navigate back to My Lists
        </v-btn>
      </v-card-actions>
    </v-card>
  </div>
</template>

<script lang="ts" setup>
import { VBtn, VCard, VCardActions } from 'vuetify/components';
import { useRouter } from 'vue-router';
import { Route } from '@/router';

const router = useRouter();

const props = defineProps<{
  id: string,
}>();
</script>
