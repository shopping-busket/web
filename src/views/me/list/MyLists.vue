<template>
  <div class="ma-auto mt-4" style="max-width: 70rem">
    <v-card
      v-for="item in lists as Array<IShoppingList>"
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
            icon="mdi-trash-can-outline"
            @click.stop="deleteList(item.listid)"
          />
        </template>
      </v-list-item>
    </v-card>
    <v-card
      :ripple="true"
      class="d-flex justify-center flex-column align-center new-list-card"
      hover
      variant="outlined"
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
              v-model="newList.name" :rules="nameRules"
              autofocus
              color="primary"
              counter="32"
              density="compact"
              label="Name"
              variant="outlined"
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
              :disabled="!incorrectEntries"
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
  VBtn,
  VCard,
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
  const l: IShoppingList[] = ((await listService.find({ query: { owner: auth.value?.user.uuid } })) as IShoppingList[]);

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
