<template>
  <div class="ma-auto mt-4" style="max-width: 70rem">
    <v-card
      v-for="item in lists"
      :key="item.listid"
      :ripple="true"
      hover
      variant="flat"
      class="mb-2 v-ripple"
      @click="openList(item.listid)"
    >
      <v-list-item :title="item.name" :subtitle="item.description">
        <template #append>
          <v-icon
            icon="mdi-trash-can-outline"
            color="red"
            @click.stop="deleteList(item.listid)"
          />
        </template>
      </v-list-item>
    </v-card>
    <v-card
      outlined
      :ripple="true"
      hover
      class="d-flex justify-center flex-column align-center new-list-card"
      @click="feathersClient.io.connected ? newListDialog = true : toast('You are offline!')"
    >
      <div class="new-list-title">
        New List
      </div>
      <v-icon icon="mdi-plus-circle-outline" />
    </v-card>

    <v-dialog v-model="newListDialog" max-width="550px">
      <v-card>
        <v-card-title>
          Create a new list or <a class="mx-1" @click="importDialog = true">import</a> one.
        </v-card-title>
        <v-card-subtitle>
          Name and title can be edited later.
        </v-card-subtitle>

        <v-card-text class="mt-1">
          <v-form ref="newListForm" v-model="incorrectEntries" @submit.stop="createList()">
            <v-text-field
              v-model="newList.name" label="Name"
              variant="outlined"
              color="primary"
              density="compact"
              :rules="nameRules"
              counter="32"
              autofocus
            />
            <v-textarea
              v-model="newList.description"
              variant="outlined"
              color="primary"
              label="Description"
              height="80px"
              no-resize
              counter
              :rules="descriptionRules"
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
              color="primary"
              variant="outlined"
              rounded
              width="200px"
              :disabled="!incorrectEntries"
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
            ref="fileUpload" accept="application/json"
            @change="setImportFile"
          />

          <div class="d-flex flex-row">
            <v-btn
              color="red"
              text
              @click="importDialog = false"
            >
              Cancel
            </v-btn>

            <v-spacer />

            <v-btn
              color="primary"
              outlined
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
</template>

<script lang="ts" setup>
import {
  VListItem,
  VCard,
  VCardTitle,
  VCardSubtitle,
  VIcon,
  VBtn,
  VTextField,
  VTextarea,
  VForm,
  VSpacer,
  VCardText,
  VDialog,
  VFileInput,
} from 'vuetify/components';
import { v4 as uuidv4 } from 'uuid';
import feathersClient, { AuthObject, listService } from '@/feathers-client';
import { IShoppingList } from '@/shoppinglist/ShoppingList';
import { onMounted, ref, Ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'vue-toastification';

const router = useRouter();
const toast = useToast();

const nameRules = [
  (val: string) => val.length >= 3 || 'Name has to have at least 3 characters.',
  (val: string) => val.length <= 32 || 'Name mustn\'t exceed the 32 character limit!',
];
const descriptionRules = [
  (val: string) => val.length <= 300 || 'Description length shouldn\'t exceed 300 characters.',
];
const incorrectEntries = ref(false);
const importDialog = ref(false);
const newListDialog = ref(false);
const newList = ref({
  name: '',
  description: '',
});
const auth: Ref<null | AuthObject> = ref(null);
const lists: Ref<Array<IShoppingList> | null> = ref(null);
const importFile: Ref<File | null> = ref(null);

onMounted(async () => {
  if (!feathersClient.io.connected) {
    console.log('Not connected to server! Loading lists from storage...');
    const stored = localStorage.getItem('lists');
    console.log(stored);
    if (!stored) {
      localStorage.setItem('lists', JSON.stringify([]));
      console.log('No lists found in storage. Offline will not work!');
      return;
    }

    lists.value = JSON.parse(stored);
    return;
  }

  auth.value = await feathersClient.get('authentication');
});

function setImportFile(file: File): void {
  importFile.value = file;
}

async function populateLists(): Promise<void> {
  const l: Array<IShoppingList> = ((await listService.find({ query: { owner: auth.value?.user.uuid } })) as { data: Array<IShoppingList> }).data;

  lists.value = l.map((l) => {
    const o = l;
    o.additional = {
      loading: false,
    };
    return o;
  });

  localStorage.setItem('lists', JSON.stringify(lists.value));
}

watch(auth, populateLists);

async function deleteList(listid: string): Promise<void> {
  let id = 0;

  if (!lists.value) return;
  lists.value.forEach((l, i) => {
    if (l.listid === listid) {
      id = l.id;

      if (!lists.value) return;
      lists.value.splice(i, 1);
    }
  });

  await listService.remove(id);
}

async function uploadImportedList(): Promise<void> {
  if (!importFile.value) return;
  const file = importFile.value;

  if (file.type !== 'application/json') {
    console.log('Wrong file type');
    return;
  }

  const reader = new FileReader();

  reader.onload = async (e) => {
    const content = e.target?.result as string;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const list = JSON.parse(content);

    const newList = {
      listid: list.listid ?? uuidv4(),
      name: list.name ?? 'placeholder name',
      description: list.description ?? '',
      owner: auth.value?.user?.uuid,
      entries: list.entries ?? {},
    };

    newListDialog.value = false;

    await listService.create(newList);
    await populateLists();
    console.log('created list', newList.name);

    openList(newList.listid);
  };

  reader.readAsText(file);
}

function openList(id: string): void {
  const item = lists.value?.find((i) => i.listid === id) || null;
  if (!item) return;

  item.additional.loading = true;
  router.push(`/me/list/${item.listid}`);
}

async function createList(): Promise<void> {
  if (!auth.value) return;

  const {
    name,
    description
  } = newList.value;
  const list = {
    listid: uuidv4(),
    name,
    description,
    owner: auth.value?.user.uuid,
    entries: {
      items: [],
    },
    checkedEntries: {
      items: [],
    },
  };

  newList.value.name = '';
  newList.value.description = '';

  await listService.create(list);
  await populateLists();

  openList(list.listid);
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
</style>
