<template>
  <v-dialog v-model="show" max-width="500px">
    <v-card
      :title="title"
      :subtitle="subtitle"
      :text="text"
    >
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" color="primary" @click="emit('cancel'); show = false">
          Cancel
        </v-btn>

        <v-btn
          color="primary"
          variant="flat"
          autofocus
          rounded="md"
          @click="emit('confirm'); show = false"
        >
          Yes, I am sure
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import {VBtn, VCard, VCardActions, VDialog, VSpacer} from "vuetify/components";

const props = defineProps<{
  title: string,
  subtitle?: string,
  text?: string,
}>();
const show = defineModel<boolean>();
const emit = defineEmits(['cancel', 'confirm']);
</script>
