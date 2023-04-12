<template>
  <v-dialog
    v-model="openDialog"
    max-width="500px"
  >
    <v-card title="Manage Whitelist">
      <v-card-text>
        <v-list v-if="whitelistedUsers.length > 0" :lines="'one'">
          <v-list-item
            v-for="(whitelist, i) in whitelistedUsers"
            :key="whitelist.listId"
            :title="whitelist.inviteEmail"
            append-icon="mdi-pencil-outline"
            :ripple="true"
            :prepend-avatar="getGravatar(whitelist)"
            @click="editUserDialog = true; editUserIndex = i"
          >
            <v-list-item-subtitle>
              <div v-if="whitelist.user == null">
                <v-icon icon="mdi-account-clock-outline" size="small" />
                Invitation Pending...
              </div>
              <div v-else>
                <v-icon icon="mdi-account-check-outline" size="small" />
                Joined
              </div>
            </v-list-item-subtitle>
          </v-list-item>
        </v-list>
        <div v-else class="d-flex justify-center align-center mb-8 mt-4" style="opacity: 70%">
          Nobody is whitelisted. Start by inviting somebody!
        </div>

        <div class="d-flex align-center mt-4">
          <v-text-field
            v-model="email" variant="underlined" density="compact"
            style="height: 2.3rem; margin-right: 1rem" color="primary" label="E-Mail"
            @keydown.enter="addToWhitelist"
          />

          <v-btn
            :loading="inviteButtonLoading"
            color="primary"
            variant="outlined"
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
      v-if="editUserIndex != -1"
      :title="`Edit ${whitelistedUsers[editUserIndex].inviteEmail}'s Permissions`"
      subtitle="Manage this users permissions or kick him of your list here."
    >
      <v-card-text>
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

        <div class="d-flex align-content-space-between">
          <v-btn
            class="flex-grow-1"
            color="red"
            variant="tonal"
            size="small"
            @click="kickUserIndex = editUserIndex; kickUserConfirmationDialog = true"
          >
            Kick User
          </v-btn>
        </div>
      </v-card-text>
      <v-card-actions>
        <v-btn
          color="primary" variant="text" block
          @click="updateUserPermissions(whitelistedUsers[editUserIndex]); editUserDialog = false"
        >
          Save
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-dialog v-model="kickUserConfirmationDialog" width="500px">
    <v-card
      title="Confirmation"
      text="Are you sure that you want to kick this user off your list? They will be unable to access this list!"
    >
      <v-card-actions>
        <v-spacer />
        <v-btn color="primary" @click="kickUserConfirmationDialog = false">
          Cancel
        </v-btn>

        <v-btn color="primary" @click="kickUser(kickUserIndex); kickUserConfirmationDialog = false">
          Yes, I am sure
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import {
  VBtn,
  VIcon,
  VSpacer,
  VCard,
  VCardActions,
  VCardText,
  VDialog,
  VList,
  VListItem,
  VListItemSubtitle,
  VListItemAction,
  VCheckboxBtn,
  VTextField,
} from 'vuetify/components';
import { computed, onMounted, reactive, Ref, ref } from 'vue';
import feathersClient, { BadRequest, DB, FeathersError, Service } from '@/feathers-client';
import { ReactiveVariable } from 'vue/macros';
import { Params } from '@feathersjs/feathers';
import md5 from '@/helpers/md5';
import { useToast } from 'vue-toastification';

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

const toast = useToast();

const inviteButtonLoading = ref(false);
const email: Ref<string> = ref('');
const editUserDialog = ref(false);
const editUserIndex = ref(-1);
const kickUserConfirmationDialog = ref(false);
const kickUserIndex = ref(-1);

export interface UserWhitelist extends DB {
  id: number,
  user: string,
  inviteEmail: string,
  inviteSecret?: string,
  listId: string,

  canEditEntries: boolean,
  canDeleteEntries: boolean,
}

export type UserPermissions = Pick<UserWhitelist, 'canDeleteEntries' | 'canEditEntries'>;

const whitelistedUsers: ReactiveVariable<UserWhitelist[]> = reactive([]);

onMounted(async () => {
  const links = await feathersClient.service(Service.WHITELISTED_USERS).find({
    query: {
      listId: props.listId,
    },
  } as Params<Partial<UserWhitelist>>);

  if (links != null) whitelistedUsers.push(...links);

  feathersClient.service(Service.WHITELISTED_USERS).on('patched', (d: UserWhitelist) => {
    whitelistedUsers.splice(whitelistedUsers.findIndex((u) => u.id === d.id), 1, d);
  });
});

async function addToWhitelist() {
  inviteButtonLoading.value = true;

  await feathersClient.service(Service.WHITELISTED_USERS).create({
    inviteEmail: email.value,
    listId: props.listId,
  } as Partial<UserWhitelist>).then((whitelisted) => {
    whitelistedUsers.push(whitelisted);
  }).catch((err: FeathersError<BadRequest>) => {
    let emailFormatErr = false;
    if (Array.isArray(err.data)) emailFormatErr = err.data[0].keyword === 'format';
    else emailFormatErr = err.data.keyword === 'format';

    if (emailFormatErr) toast('Input has to be an email!');
    else toast.error('Unexpected Error! Try again.')
  });

  inviteButtonLoading.value = false;
  email.value = '';
}

async function updateUserPermissions(whitelist: UserWhitelist) {
  console.log('upd usr perm', whitelist.canEditEntries, whitelist.canDeleteEntries);

  await feathersClient.service(Service.WHITELISTED_USERS).patch(whitelist.id, {
    canEditEntries: whitelist.canEditEntries,
    canDeleteEntries: whitelist.canDeleteEntries,
  } as Partial<UserWhitelist>);
}

async function kickUser(index: number) {
  editUserIndex.value = -1;
  editUserDialog.value = false;

  await feathersClient.service(Service.WHITELISTED_USERS).remove(whitelistedUsers[index].id);
  whitelistedUsers.splice(index, 1);
}

function getGravatar(whitelist: UserWhitelist): string {
  return `https://gravatar.com/avatar/${md5(whitelist.inviteEmail.toLowerCase())}?s=60&d=monsterid`;
}
</script>
