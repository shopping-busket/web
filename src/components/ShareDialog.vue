<template>
  <v-dialog
    v-model="openDialog"
  >
    <v-card>
      <v-card-text>
        <div v-for="link in shareLinks" :key="link.id">
          {{ link.uri }}
        </div>
      </v-card-text>
      <v-card-actions>
        <v-btn color="primary" variant="text" @click="openDialog = false">
          Close
        </v-btn>

        <v-btn color="primary" variant="outlined" @click="createShareLink">
          Create new share link
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import { VBtn, VCard, VCardActions, VCardText, VDialog } from 'vuetify/components';
import { computed, onMounted, Ref, ref } from 'vue';
import feathersClient from '@/feathers-client';

const props = defineProps<{
  modelValue: boolean,
  listId: string,
}>();
const emit = defineEmits(['update:modelValue']);

const openDialog = computed({
  get() {
    return props.modelValue;
  },

  set(value: boolean) {
    return emit('update:modelValue', value);
  }
});

export interface ShareLink {
  id: number,
  uri: string,
  pointsTo: string,
  users: string[],
}

const shareLinks: Ref<ShareLink[]> = ref([]);

onMounted(async () => {
  console.log(props.listId);

  const links = await feathersClient.service('share-link').find({
    query: {
      pointsTo: props.listId,
    },
  });


  console.log(links);
  if (links != undefined) shareLinks.value.push(links);
  console.log(shareLinks);
});

async function createShareLink() {
  const shareLink = await feathersClient.service('share-link').create({
    pointsTo: props.listId,
    users: [],
  });

  shareLinks.value.push(shareLink);
}
</script>
