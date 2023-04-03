<template class="w-100 h-100">
  <v-card
    variant="outlined"
    class="w-33 ma-auto mt-16"
    title="List not found"
    :text="`The requested list with id ${props.id} was not found in our database or you don't have sufficient permissions to access it. Should the problem persist please contact us.`"
  >
    <v-card-actions>
      <v-btn variant="elevated" elevation="0" color="primary" block @click="router.push({ name: Route.MY_LISTS })">
        Navigate back to My Lists
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script lang="ts" setup>
import { VCard, VCardActions, VBtn } from 'vuetify/components';
import { useRouter } from 'vue-router';
import { Route } from '@/router';

const router = useRouter();

const props = defineProps<{
  id: string,
}>();
</script>
