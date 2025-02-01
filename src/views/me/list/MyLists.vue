<template>
  <div class="ma-auto pt-4" style="max-width: 70rem">
    <v-card
      v-for="item in libraryStore.$state"
      :key="item.listid"
      :ripple="true"
      class="mb-2 v-ripple pb-1 pt-1"
      hover
      variant="outlined"
      @click="openList(item.listid)"
    >
      <v-list-item :subtitle="item.description" :title="item.name" class="pb-2">
        <template #append>
          <v-icon
            color="red"
            :icon="item.owner === user?.uuid ? 'mdi-trash-can-outline' : 'mdi-exit-run'"
            @click.stop="removeListDialog = true; removeList = item"
          />
        </template>
      </v-list-item>
    </v-card>
    <v-card
      v-if="feathersClient.io.connected"
      :ripple="true"
      class="d-flex justify-center flex-column align-center new-list-card"
      hover
      variant="outlined"
      @click="feathersClient.io.connected ? showNewListDialog() : toast('You are offline!')"
    >
      <div class="new-list-title">
        New List
      </div>
      <v-icon icon="mdi-plus-circle-outline" />
    </v-card>
    <transition appear v-else>
      <v-alert variant="tonal" color="primary" icon="mdi-information-outline" v-if="!user">
        Log in to create lists
      </v-alert>
    </transition>

    <v-dialog v-model="newListDialog" max-width="550px">
      <v-card>
        <v-card-title>
          Create a new list or <a class="mx-1" @click="importDialog = true">import</a> one.
        </v-card-title>
        <v-card-subtitle>
          Name and title can be edited later.
        </v-card-subtitle>

        <v-card-text class="mt-1">
          <v-form
            ref="newListForm" v-model="isNewListNameValid" validate-on="input"
            @submit.prevent="createList()"
          >
            <v-text-field
              v-model="newList.name"
              :rules="nameRules"
              autofocus
              color="primary"
              counter="32"
              density="compact"
              label="Name"
              variant="outlined"
              @keyup.once="newListForm?.validate()"
            />
            <v-textarea
              v-model="newList.description"
              :rules="descriptionRules"
              color="primary"
              counter
              height="80px"
              label="Description"
              no-resize
              variant="outlined"
            />
          </v-form>

          <div class="d-flex flex-row">
            <v-btn
              color="red"
              variant="text"
              @click="newListDialog = false"
            >
              Cancel
            </v-btn>

            <v-spacer />

            <v-btn
              :disabled="!isNewListNameValid"
              color="primary"
              rounded
              variant="outlined"
              width="200px"
              @click="createList(); newListDialog = false"
            >
              Create
            </v-btn>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>

    <v-dialog v-model="importDialog" max-width="550px">
      <v-card>
        <v-card-title>
          Import a list.
        </v-card-title>
        <v-card-subtitle>
          You can import downloaded lists by uploading the JSON file.
        </v-card-subtitle>

        <v-card-text class="mt-1">
          <v-file-input
            v-if="importFile"
            ref="fileUpload" v-model="importFile" accept="application/json"
            variant="underlined"
          />

          <div class="d-flex flex-row">
            <v-btn
              color="red"
              variant="text"
              @click="importDialog = false"
            >
              Cancel
            </v-btn>

            <v-spacer />

            <v-btn
              color="primary"
              variant="outlined"
              rounded
              width="200px"
              @click="importDialog = false; uploadImportedList()"
            >
              Import
            </v-btn>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>

  <v-dialog v-model="removeListDialog" max-width="500px">
    <v-card
      :title="`Are you sure that you want to ${removeList?.owner === user?.uuid ? 'delete' : 'leave'} this list?`"
      :subtitle="removeList?.owner === user?.uuid ? 'You won\'t be able to get it back' : 'You will not be able to access it until you get another invite'"
    >
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" color="primary" @click="removeListDialog = false">
          Cancel
        </v-btn>

        <v-btn
          v-if="removeList"
          color="primary"
          variant="outlined"
          @click="removeList?.owner === user?.uuid ? deleteList(removeList.listid) : leaveFromList(removeList.listid); removeListDialog = false"
        >
          Yes, I am sure
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
  VCardSubtitle,
  VCardText,
  VCardTitle,
  VDialog,
  VFileInput,
  VForm,
  VIcon,
  VListItem,
  VSpacer,
  VTextarea,
  VTextField,
} from 'vuetify/components';
import feathersClient, { AuthObject, Service } from '@/feathers-client';
import { IShoppingList, LegacyShoppingListItem } from '@/shoppinglist/ShoppingList';
import { inject, onMounted, ref, Ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'vue-toastification';
import { userInjection } from '@/helpers/injectionKeys';
import { UserWhitelist } from '@/components/ShareDialog.vue';
import { Route } from '@/router';
import { useLibraryStore } from '@/stores/library.store';
import { comparatorSortAlphabetically } from '@/helpers/utils';
import { Params } from '@feathersjs/feathers';

const router = useRouter();
const toast = useToast();
const user = inject(userInjection);

const nameRules = [
  (val: string) => val.length >= 3 || 'Name has to have at least 3 characters.',
  (val: string) => val.length <= 32 || 'Name mustn\'t exceed the 32 character limit!',
];
const descriptionRules = [
  (val: string) => val.length <= 300 || 'Description length shouldn\'t exceed 300 characters.',
];
const isNewListNameValid: Ref<boolean | null> = ref(false);
const importDialog = ref(false);
const newListDialog = ref(false);
const newList = ref({
  name: '',
  description: '',
});
const auth: Ref<null | AuthObject> = ref(null);
const importFile: Ref<File[] | null> = ref([]);
const newListForm: Ref<VForm | null> = ref(null);
const removeListDialog = ref(false);
const removeList: Ref<IShoppingList | null> = ref(null);

const libraryStore = useLibraryStore();

export interface LibraryEntry {
  user: string,
  listId: string,
  list: IShoppingList,
}

onMounted(async () => {
  if (!feathersClient.io.connected) return;
  auth.value = await feathersClient.get('authentication');

  await populateLists();
});

async function showNewListDialog() {
  newListDialog.value = true;

  if (newList.value.name.length === 0 && newList.value.description.length === 0) return;
  // Has to be called twice due to vuetify bug!
  await newListForm.value?.validate();
  await newListForm.value?.validate();
}

async function populateLists(): Promise<void> {
  const library = await feathersClient.service(Service.LIBRARY).find() as LibraryEntry[];
  libraryStore.updateLibrary(
    library.map((entry) => {
      return {
        ...entry.list,
        additional: {
          loading: false,
        },
      };
    }).sort((a, b) => comparatorSortAlphabetically(a.name, b.name))
  );
}

watch(auth, populateLists);

async function leaveFromList(listid: string): Promise<void> {
  libraryStore.removeById(listid);

  const { id } = (await feathersClient.service(Service.WHITELISTED_USERS).find({
    query: {
      user: user?.uuid,
      listId: listid,
    }
  } as Params<Partial<UserWhitelist>>) as UserWhitelist[])[0];

  await feathersClient.service(Service.WHITELISTED_USERS).remove(id);
}

async function deleteList(listid: string): Promise<void> {
  const removed = libraryStore.removeById(listid);
  await feathersClient.service(Service.LIST).remove(removed.id);
}

async function uploadImportedList(): Promise<void> {
  if (!importFile.value) return;
  const file = importFile.value[0];

  console.log(file);

  if (file.type !== 'application/json') {
    console.log('Wrong file type');
    return;
  }

  const reader = new FileReader();

  reader.onload = async (e) => {
    const content = e.target?.result as string;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const list = JSON.parse(content) as Partial<IShoppingList>;

    // Support legacy exports
    list.entries ??= [];
    if (!list.checkedEntries) list.checkedEntries = list.entries.filter(e => Object.hasOwn(e, 'done') ? (e as LegacyShoppingListItem).done : false);
    list.entries = list.entries?.filter(e => Object.hasOwn(e, 'done') ? !(e as LegacyShoppingListItem).done : true);

    const newList = {
      name: list.name ?? 'placeholder name',
      description: list.description ?? '',
      entries: list.entries ?? [],
      checkedEntries: list.checkedEntries ?? [],
    };

    newListDialog.value = false;

    const createdList = await feathersClient.service(Service.LIST).create(newList) as IShoppingList;
    await populateLists();
    console.log('created list', newList.name);

    await openList(createdList.listid);
  };

  reader.readAsText(file);
}

async function openList(id: string) {
  const index = libraryStore.findIndexById(id);
  if (index === -1) return;

  libraryStore.$state[index].additional.loading = true;
  await router.push({
    name: Route.DISPLAY_LIST,
    params: {
      id,
    },
  });
}

async function createList(): Promise<void> {
  if (!auth.value) return;

  if (isNewListNameValid.value == null) isNewListNameValid.value = (await newListForm.value?.validate())?.valid ?? false;
  if (!isNewListNameValid.value) return;

  const {
    name,
    description
  } = newList.value;
  newList.value.name = '';
  newList.value.description = '';

  const list = await feathersClient.service(Service.LIST).create({
    name,
    description,
    entries: [],
    checkedEntries: [],
  }) as IShoppingList;

  await populateLists();
  await openList(list.listid);
}
</script>

<style lang="scss" scoped>
.title-dense {
  line-height: 1.2rem;
}

.new-list-card {
  height: 72px;
}

.new-list-title {
  font-size: 1.25rem;
  font-weight: bold;
}

.icon-height {
  height: 24px;
}

.v-enter-active,
.v-leave-active {
  transition: all 0.3s ease;
}

.v-enter-from {
  opacity: 0;
  transform: translateY(-100px);
}

.v-leave-to {
  opacity: 0;
}
</style>
