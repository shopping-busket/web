<template>
  <v-dialog
    v-model="openDialog"
    max-width="500px"
  >
    <v-card>
      <v-card-text>
        <v-list :lines="'one'">
          <v-list-item
            v-for="(whitelist, i) in whitelistedUsers"
            :key="whitelist.listId"
            :title="whitelist.inviteEmail"
            subtitle="Pending..."
            append-icon="mdi-pencil-outline"
            :ripple="true"
            :prepend-avatar="getGravatar(whitelist)"
            @click="editUserDialog = true; editUserIndex = i"
          />
        </v-list>

        <div class="d-flex align-center mt-4">
          <v-text-field
            v-model="email" variant="underlined" density="compact"
            style="height: 2.3rem; margin-right: 1rem" color="primary" label="E-Mail"
            @keydown.enter="addToWhitelist"
          />

          <v-btn
            color="primary" variant="outlined"
            @click="addToWhitelist"
          >
            Invite User
          </v-btn>
        </div>
      </v-card-text>
      <v-card-actions>
        <v-btn color="primary" variant="text" block @click="openDialog = false">
          Close
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-dialog v-model="editUserDialog" width="500px" persistent>
    <v-card
      :title="`Edit ${whitelistedUsers[editUserIndex].inviteEmail}'s Permissions`"
      subtitle="Manage this users permissions or kick him of your list here."
    >
      <v-card-text />
      <v-list select-strategy="classic">
        <v-list-item
          value="edit"
          title="Move, Rename and Check Entries"
          subtitle="Deleting entries is not included"
          @click="whitelistedUsers[editUserIndex].canEditEntries = !whitelistedUsers[editUserIndex].canEditEntries"
        >
          <template #prepend>
            <v-list-item-action start>
              <v-checkbox-btn
                v-model="whitelistedUsers[editUserIndex].canEditEntries"
              />
            </v-list-item-action>
          </template>
        </v-list-item>

        <v-list-item
          value="delete"
          title="Delete Entries"
          subtitle="Moving, renaming and checking entries is not included"
          @click="whitelistedUsers[editUserIndex].canDeleteEntries = !whitelistedUsers[editUserIndex].canDeleteEntries"
        >
          <template #prepend>
            <v-list-item-action start>
              <v-checkbox-btn
                v-model="whitelistedUsers[editUserIndex].canDeleteEntries"
              />
            </v-list-item-action>
          </template>
        </v-list-item>
      </v-list>
      <v-card-actions>
        <v-btn color="primary" variant="text" block @click="updateUserPermissions(whitelistedUsers[editUserIndex]); editUserDialog = false">
          Save
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import {
  VBtn,
  VCard,
  VCardActions,
  VCardText,
  VDialog,
  VList,
  VListItem,
  VListItemAction,
  VCheckboxBtn,
  VTextField,
} from 'vuetify/components';
import { computed, onMounted, reactive, Ref, ref, watch } from 'vue';
import feathersClient, { DB, Service, User } from '@/feathers-client';
import { ReactiveVariable } from 'vue/macros';
import { Params } from '@feathersjs/feathers';
import crypto from 'crypto';
import md5 from '@/helpers/md5';

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

const email: Ref<string> = ref('');
const editUserDialog = ref(false);
const editUserIndex = ref(-1);

export interface UserWhitelist extends DB {
  id: number,
  user: string,
  inviteEmail: string,
  listId: string,

  canEditEntries: boolean,
  canDeleteEntries: boolean,
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
    inviteEmail: email.value,
    listId: props.listId,
  } as Partial<UserWhitelist>);

  whitelistedUsers.push(whitelisted);
}

async function updateUserPermissions(whitelist: UserWhitelist) {
  console.log('upd usr perm', whitelist.canEditEntries, whitelist.canDeleteEntries);

  await feathersClient.service(Service.WHITELISTED_USERS).patch(whitelist.id, {
    canEditEntries: whitelist.canEditEntries,
    canDeleteEntries: whitelist.canDeleteEntries,
  } as Partial<UserWhitelist>);
}

function getGravatar(whitelist: UserWhitelist): string {
  return `https://s.gravatar.com/avatar/${md5(whitelist.inviteEmail.toLowerCase())}?s=60`;
}
</script>
