<template>
  <v-dialog
    v-model="openDialog"
    max-width="500px"
  >
    <v-card>
      <v-card-text>
        <div v-for="link in whitelistedUsers" :key="link.id">
          <div>People with access: {{ link.users.map(l => getUsername(l)).join(', ') }}</div>
          <div>URL: {{ getURI(link) }}</div>
        </div>
      </v-card-text>
      <v-card-actions>
        <v-btn color="primary" variant="text" @click="openDialog = false">
          Close
        </v-btn>

        <v-btn color="primary" variant="outlined" @click="addToWhitelist">
          Create new share link
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import { VBtn, VCard, VCardActions, VCardText, VDialog } from 'vuetify/components';
import { computed, onMounted, reactive, Ref, ref } from 'vue';
import feathersClient, { DB, Service } from '@/feathers-client';
import { ReactiveVariable } from 'vue/macros';
import { Params } from '@feathersjs/feathers';

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

const email: Ref<string> = ref('')

export interface UserWhitelist extends DB {
  id: number,
  user: string,
  listId: string,
}

const whitelistedUsers: ReactiveVariable<UserWhitelist[]> = reactive([]);

onMounted(async () => {
  const links = await feathersClient.service(Service.WHITELISTED_USERS).find({
    query: {
      listId: props.listId,
    },
  } as Params<Partial<UserWhitelist>>);

  if (links != null) whitelistedUsers.push(...links);
});

async function addToWhitelist() {
  const whitelisted = await feathersClient.service(Service.WHITELISTED_USERS).create({
    email: email.value,
    listId: props.listId,
  } as Partial<UserWhitelist>);

  whitelistedUsers.push(whitelisted);
}

async function getWhitelistedUser(uuid: string) {
  const user = await feathersClient.service(Service.USERS).find({
    query: {
      uuid,
    }
  });

  console.log(user);
}
</script>
