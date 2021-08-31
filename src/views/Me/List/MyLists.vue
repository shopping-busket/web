<template>
  <div class="ma-auto mt-4" style="max-width: 70rem">
    <div v-for="item in lists" :key="item.listid">
      <v-card outlined ripple @click="openList(item.listid)" :loading="item.additional.loading"
              class="mb-3 d-flex flex-row justify-space-between align-center" hover>
        <div>
          <v-card-title class="title-dense">
            {{ item.name }}
          </v-card-title>
          <v-card-subtitle v-show="item.description.trim() !== ''">{{
              item.description
            }}
          </v-card-subtitle>
        </div>

        <v-icon color="red" @click.stop="deleteList(item.listid)" class="mr-6 icon-height">
          mdi-trash-can-outline
        </v-icon>
      </v-card>
    </div>
    <v-card outlined ripple hover
            class="d-flex justify-center flex-column align-center new-list-card"
            @click="feathersClient.io.connected ? newListDialog = true : $toast('You are offline!')"
    >
      <div class="new-list-title">New List</div>
      <v-icon>mdi-plus-circle-outline</v-icon>
    </v-card>

    <v-dialog v-model="newListDialog" max-width="550px">
      <v-card>
        <v-card-title>
          Create a new list or <a @click="importDialog = true" class="mx-1">import</a> one.
        </v-card-title>
        <v-card-subtitle>
          Name and title can be edited later.
        </v-card-subtitle>

        <v-card-text class="mt-1">
          <v-form v-model="incorrectEntries" ref="newListForm">
            <v-text-field label="Name" outlined dense
                          v-model="newList.name"
                          :rules="nameRules"
                          autofocus
            />
            <v-textarea label="Description"
                        outlined dense height="80px" no-resize counter
                        v-model="newList.description"
                        :rules="descriptionRules"
            />
          </v-form>

          <div class="d-flex flex-row">
            <v-btn
              color="red"
              text
              @click="newListDialog = false"
            >
              Cancel
            </v-btn>

            <v-spacer></v-spacer>

            <v-btn
              color="primary"
              outlined
              rounded
              width="200px"
              @click="createList(); newListDialog = false"
              :disabled="!incorrectEntries"
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
          <v-file-input ref="fileUpload" @change="uploadList"></v-file-input>

          <div class="d-flex flex-row">
            <v-btn
              color="red"
              text
              @click="importDialog = false"
            >
              Cancel
            </v-btn>

            <v-spacer></v-spacer>

            <v-btn
              color="primary"
              outlined
              rounded
              width="200px"
              @click="importDialog = false"
            >
              Import
            </v-btn>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator';
import { v4 as uuidv4 } from 'uuid';
import { InputValidationRules } from 'vuetify';
import feathersClient, { AuthObject, listService } from '@/feathers-client';
import { IShoppingList } from '@/shoppinglist/ShoppingList';

@Component
export default class MyLists extends Vue {
  private incorrectEntries = false;
  private nameRules: InputValidationRules = [
    (val) => val.length >= 3 || 'Name has to have at least 3 characters.',
    (val) => /^ *\w+ *$/.test(val) || 'Name can only include A-z, spaces and 0-9.',
  ];
  private descriptionRules: InputValidationRules = [
    (val) => val.length <= 300 || 'Description length shouldn\'t exceed 300 characters.',
  ];
  private importDialog = false;
  private newListDialog = false;
  private newList = {
    name: '',
    description: '',
  };
  private auth: null | AuthObject = null;
  private lists: Array<IShoppingList> | null = null;
  private feathersClient = feathersClient;

  async mounted (): Promise<void> {
    if (!feathersClient.io.connected) {
      console.log('Not connected to server! Loading lists from storage...');
      const stored = localStorage.getItem('lists');
      console.log(stored);
      if (!stored) {
        localStorage.setItem('lists', JSON.stringify([]));
        console.log('No lists found in storage. Offline will not work!');
        return;
      }

      this.lists = JSON.parse(stored);
      console.log(this.lists);

      return;
    }

    this.auth = await feathersClient.get('authentication');
  }

  @Watch('auth')
  async populateLists (): Promise<void> {
    const lists: Array<IShoppingList> = ((await listService.find({ query: { owner: this.auth?.user.uuid } })) as { data: Array<IShoppingList> }).data;

    this.lists = lists.map((l) => {
      const o = l;
      o.additional = {
        loading: false,
      };
      return o;
    });

    localStorage.setItem('lists', JSON.stringify(this.lists));
  }

  async deleteList (listid: string): Promise<void> {
    let id = 0;

    if (!this.lists) return;
    this.lists.forEach((l, i) => {
      if (l.listid === listid) {
        id = l.id;

        if (!this.lists) return;
        this.lists.splice(i, 1);
      }
    });

    await listService.remove(id);
  }

  uploadList (file: File): void {
    console.log(file);
    if (!file) return;
    if (file.type !== 'application/json') {
      console.log('Wrong file type');
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      const content = e.target?.result as string;
      const obj = JSON.parse(content);

      // TODO: Send list to server
    };

    reader.readAsText(file);
  }

  async createList (): Promise<void> {
    if (!this.auth) return;

    const { name, description } = this.newList;
    const list = {
      listid: uuidv4(),
      name,
      description,
      owner: this.auth?.user.uuid,
      items: {},
    };

    this.newList.name = '';
    this.newList.description = '';

    await listService.create(list);
    await this.populateLists();

    const found: IShoppingList | undefined = this.lists?.find((l) => l.listid === list.listid);
    if (!found) return;

    found.additional.loading = true;
    await this.$router.push(`/me/list/${found.listid}`);
  }

  openList (id: string): void {
    const item = this.lists?.find((i) => i.listid === id) || null;
    if (!item) return;

    item.additional.loading = true;
    this.$router.push(`/me/list/${item.listid}`);
  }
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
