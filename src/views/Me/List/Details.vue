<template>
  <div style="max-width: 800px; margin: auto" class="mt-4">
    <v-card outlined v-if="!listNotFound">
      <v-card-title>
        <div v-if="shoppingList !== null">
          {{ shoppingList.name }}
        </div>
        <div v-else>Working on it...</div>

        <v-btn icon small color="primary" @click="openLogDialog = true">
          <v-icon small>mdi-text-box</v-icon>
        </v-btn>

        <v-btn icon small color="primary" @click="downloadList">
          <v-icon small>mdi-download</v-icon>
        </v-btn>
      </v-card-title>
      <v-card-subtitle>
        <div v-if="shoppingList !== null">
          {{ shoppingList.description }}
        </div>
        <div v-else>Working on it...</div>
      </v-card-subtitle>

      <v-card-text class="mb-0 pb-0">
        <v-text-field placeholder="Add item"
                      outlined
                      append-icon="mdi-basket-plus-outline"
                      @click:append="createEntry"
                      @keydown.enter="createEntry"
                      dense
                      ref="newItemField"
                      v-model="newItemName"
                      :rules="newItemRules"
                      @blur="newItemName.length === 0 ? $refs.newItemField.resetValidation() : null"
        />
        <!--    TODO: Actually make this work good    -->
        <!--        <v-autocomplete :items="suggestedItems"-->
        <!--                        outlined-->
        <!--                        placeholder="Add item"-->
        <!--                        :search-input.sync="suggestionSearch"-->
        <!--                        :loading="suggestionLoading"-->
        <!--                        hide-no-data-->
        <!--                        hide-selected-->
        <!--                        append-icon="mdi-basket-plus-outline"-->
        <!--                        @click:append="addListEntry()"-->
        <!--                        dense-->
        <!--        /> -->
      </v-card-text>
    </v-card>

    <v-sheet outlined rounded class="mt-3 pa-2" v-if="!listNotFound">
      <div v-if="shoppingList === null"
           class="d-flex justify-center align-items">
        Loading
        <v-progress-circular color="primary" :size="25" :width="3" indeterminate
                             class="ml-2"></v-progress-circular>
      </div>
      <div v-else>
        <TodoList
          label="Todo"
          :shopping-list="shoppingList"
          is-todo-list
          @clearDone="clearDone"
          @checkEntry="checkEntry"
          @renameEntry="renameEntry"
          class="mb-4"
        />

        <TodoList
          label="Done"
          :shopping-list="shoppingList"
          @clearDone="clearDone"
          @checkEntry="checkEntry"
          @renameEntry="renameEntry"
        />
      </div>
    </v-sheet>
    <div v-else class="text-center mt-16">
      <div class="header">404</div>
      <div class="text-subtitle-1">List not found.</div>
      <p>We can't find this list in our database.</p>
      <v-btn outlined color="primary" rounded width="300px"
             @click="$router.push({ name: 'my lists' })">Go to my lists
      </v-btn>
    </div>

    <!-- TODO: Change list name   -->
    <EventViewer
      v-if="shoppingList !== null"
      :list-name="shoppingList.name"
      :events="events"
      v-model="openLogDialog"
    />
  </div>
</template>

<script lang="ts">
import {
  Component,
  Prop,
  Vue,
  Watch,
} from 'vue-property-decorator';
import vuedraggable from 'vuedraggable';
import EventViewer from '@/components/EventViewer.vue';
import TodoList from '@/components/TodoList.vue';
import feathersClient, { eventService, listService, User } from '@/feathers-client';
import ShoppingList, { IShoppingList } from '@/shoppinglist/ShoppingList';

export enum EventType {
  MOVE_ENTRY = 'MOVE_ENTRY',
  DELETE_ENTRY = 'DELETE_ENTRY',
  CREATE_ENTRY = 'CREATE_ENTRY',
  CHANGED_ENTRY_NAME = 'CHANGED_ENTRY_NAME',
  MARK_ENTRY_DONE = 'MARK_ENTRY_DONE',
  MARK_ENTRY_TODO = 'MARK_ENTRY_TODO',
}

export interface LogEvent {
  event: EventType,
  entryId: string,
  state: {
    name: string,
    done: boolean,
  },
  isoDate: string,
}

@Component({
  components: {
    EventViewer,
    TodoList,
    vuedraggable,
  },
})
export default class Details extends Vue {
  @Prop() private id: string | undefined;
  protected suggestedItems: string[] = [];
  private suggestionSearch = '';
  private suggestionLoading = false;
  private openLogDialog = false;
  private shoppingList: ShoppingList | null = null;
  private newItemName = '';
  private newItemRules = [
    (val: string) => /^ *\w+ *$/.test(val) || 'Allowed characters: A-z, spaces',
  ];
  private user: null | User = null;
  private listNotFound = false
  private events: LogEvent[] = [];
  private readonly connected = feathersClient.io.connected;

  async mounted (): Promise<void> {
    await this.connectionChange();

    window.addEventListener('keydown', (e) => {
      if (e.key === '/') {
        e.preventDefault();
        console.log('shift+7 search open/close');
        // TODO: Implement search
      }
    });

    if (!feathersClient.io.connected) {
      const lists = localStorage.getItem('lists');
      if (!lists) {
        console.log('Lists not found');
        localStorage.setItem('lists', JSON.stringify([]));
        this.listNotFound = true;
        return;
      }

      const list = (JSON.parse(lists) as Array<IShoppingList>).find((l) => l.listid === this.id);
      if (!list) {
        this.listNotFound = true;
        return;
      }

      this.shoppingList = new ShoppingList(list.name, list.description, list.owner, list.items.items);
      this.events = this.loadStoredEvents();
      return;
    }

    const list: IShoppingList[] | null = (await listService.find({ query: { listid: this.id } }).catch(() => {
      this.listNotFound = true;
    }) as { data: IShoppingList[] })?.data;
    if (!list || this.listNotFound) return;

    this.shoppingList = new ShoppingList(list[0].name, list[0].description, list[0].owner, list[0].items.items);

    this.user = await feathersClient.get('authentication').user;

    this.events = this.loadStoredEvents();
  }

  @Watch('connected')
  connectionChange (): void {
    if (this.connected) {
      this.sendEventsToServer();
      console.log('Sending events to server.');
    }
  }

  async clearDone (): Promise<void> {
    if (!this.shoppingList) return;

    const deleted = this.shoppingList.clearDone();

    // eslint-disable-next-line no-restricted-syntax
    for (const entry of deleted) {
      // eslint-disable-next-line no-await-in-loop
      await this.recordEvent({
        event: EventType.DELETE_ENTRY,
        entryId: entry.id,
        isoDate: (new Date()).toISOString(),
        state: {
          name: entry.name,
          done: entry.done,
        },
      });
    }
  }

  // Item function wrappers
  async renameEntry (id: string): Promise<void> {
    if (!this.shoppingList) return;

    const item = this.shoppingList.items.find((t) => t.id === id);
    if (!item) return;

    this.shoppingList.renameItem(item.id, item.additional.editName);
    item.additional.edit = false;

    await this.recordEvent({
      event: EventType.CHANGED_ENTRY_NAME,
      entryId: id,
      isoDate: (new Date()).toISOString(),
      state: {
        name: item.name,
        done: item.done,
      },
    });
  }

  async createEntry (): Promise<void> {
    const name = this.newItemName;

    for (let i = 0; i < this.newItemRules.length; i++) {
      const rule = this.newItemRules[i];
      if (typeof rule(name) === 'string') {
        this.$toast('Name needs at least 1 character; Can include A-z, space');
        return;
      }
    }

    if (!this.shoppingList) return;

    const item = this.shoppingList.createItem(this.newItemName);
    item.additional = {
      edit: false,
      editName: item.name,
      focused: false,
    };

    this.newItemName = '';
    (this.$refs.newItemField as unknown as { resetValidation: () => void }).resetValidation();

    await this.recordEvent({
      event: EventType.CREATE_ENTRY,
      entryId: item.id,
      isoDate: (new Date()).toISOString(),
      state: {
        name: item.name,
        done: item.done,
      },
    });
  }

  async checkEntry (id: string, check = true): Promise<void> {
    if (!this.shoppingList) return;

    const item = this.shoppingList?.items.find((t) => t.id === id);
    if (!item) return;

    this.shoppingList.checkItem(id, check);

    await this.recordEvent({
      event: EventType.MARK_ENTRY_DONE,
      entryId: item.id,
      isoDate: (new Date()).toISOString(),
      state: {
        name: item.name,
        done: item.done,
      },
    });
  }

  downloadList (): void {
    if (!this.shoppingList) return;
    let { name } = this.shoppingList;
    const obj = this.shoppingList;
    const fileType = 'json';

    name.trim().replaceAll(' ', '_');
    name += '-export';

    const dataStr = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(obj))}`;
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute('href', dataStr);
    downloadAnchorNode.setAttribute('download', `${name}.${fileType}`);
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  }

  // Log wrapper
  loadStoredEvents (): Array<LogEvent> {
    let ls: string | null = localStorage.getItem(`events-${this.id}`);
    if (!ls) return [];

    ls = JSON.parse(ls || '');

    return ls as unknown as Array<LogEvent>;
  }

  async sendEventsToServer (): Promise<unknown> {
    return eventService.create(this.events).then((d) => {
      this.events.splice(0, (d as Array<LogEvent>).length);
      localStorage.setItem(`events-${this.id}`, JSON.stringify(this.events));
    }).catch(() => {
      console.log('[LOG] Can\'t send events to server! no-connection');
    });
  }

  async recordEvent (event: LogEvent): Promise<unknown> {
    const stored = localStorage.getItem('lists');
    if (!stored) {
      localStorage.setItem('lists', JSON.stringify([]));
    }
    const lists = JSON.parse(stored || '[]') as Array<IShoppingList>;
    for (let i = 0; i < lists.length; i++) {
      if (lists[i].listid === this.id && this.shoppingList) {
        lists[i] = this.shoppingList.toInterface(lists[i].id);
      }
    }
    localStorage.setItem('lists', JSON.stringify(lists));

    console.log('[LOG]', event);
    this.events.push(event);

    localStorage.setItem(`events-${this.id}`, JSON.stringify(this.events));

    return this.sendEventsToServer();
  }

  // Suggestion autocomplete stuff
  // TODO: Make actual API call
  @Watch('suggestionSearch')
  suggestionAPICall (val: string): void {
    this.suggestionLoading = true;
    setTimeout(() => {
      const names = [
        'ham',
        'beer',
        'Chicken',
        'milch',
        'water',
        'cheese',
      ];
      const out = names.find((n) => n.includes(val));
      console.log(out, val);
      if (!out) return;
      this.suggestedItems.push(out);
      this.suggestionLoading = false;
    }, Math.random() * 10);
  }
}
</script>

<style scoped>
.header {
  color: #3b3b3b;
  font-size: 7rem;
  line-height: 6rem;
}
</style>
