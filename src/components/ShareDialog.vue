<template>
  <v-dialog
    v-model="openDialog"
  >
    <v-card>
      <v-card-text>
        <div v-for="link in shareLinks" :key="link.id">
          <div>People with access: {{ link.users.map(l => getUsername(l)).join(', ') }}</div>
          <div>URL: {{ getURI(link) }}</div>
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
import { computed, onMounted, reactive } from 'vue';
import feathersClient from '@/feathers-client';
import { ReactiveVariable } from 'vue/macros';
import config from '../../config';
import { RouteRecord, useRoute, useRouter } from 'vue-router';
import { Route } from '../router';

const props = defineProps<{
  modelValue: boolean,
  listId: string,
}>();
const emit = defineEmits(['update:modelValue']);

const router = useRouter();

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

const shareLinks: ReactiveVariable<ShareLink[]> = reactive([]);

onMounted(async () => {
  console.log(props.listId);

  const links = await feathersClient.service('share-link').find({
    query: {
      pointsTo: props.listId,
    },
  });

  if (links != null) shareLinks.push(...links);
});

async function createShareLink() {
  const shareLink = await feathersClient.service('share-link').create({
    pointsTo: props.listId,
    users: [],
  });

  shareLinks.push(shareLink);
}

function getURI(shareLink: ShareLink): string {
  return `${config.httpProtocol}://${config.uri}${router.getRoutes().find((r: RouteRecord) => r.name === Route.DISPLAY_LIST)?.path.replace(':id', '')}${shareLink.uri}`;
}

async function getUsername(id: string) {
  const data = await feathersClient.service('users').find({
    query: {
      uuid: id,
    },
  });

  console.log(data);
}
</script>
