<template>
  <div style="max-width: 800px; margin: auto" class="mt-4">
    <v-card v-if="!listNotFound" outlined>
      <v-card-title>
        <div v-if="shoppingList !== null">
          {{ shoppingList.name }}
        </div>
        <div v-else>
          Working on it...
        </div>

        <v-btn icon small color="primary" @click="openLogDialog = true">
          <v-icon small>
            mdi-text-box
          </v-icon>
        </v-btn>

        <v-btn icon small color="primary" @click="downloadList">
          <v-icon small>
            mdi-download
          </v-icon>
        </v-btn>
      </v-card-title>
      <v-card-subtitle>
        <div v-if="shoppingList !== null">
          {{ shoppingList.description }}
        </div>
        <div v-else>
          Working on it...
        </div>
      </v-card-subtitle>

      <v-card-text class="mb-0 pb-0">
        <v-text-field
          ref="newItemField"
          v-model="newItemName"
          placeholder="Add item"
          outlined
          append-icon="mdi-basket-plus-outline"
          dense
          :rules="newItemRules"
          @click:append="createEntry"
          @keydown.enter="createEntry"
          @blur="newItemName.length === 0 && newItemField && newItemField.resetValidation()"
        />
        <!--        TODO: <v-autocomplete :items="suggestedItems"-->
        <!--                        outlined-->
        <!--                        placeholder="Add item"-->
        <!--                        :search-input.sync="suggestionSearch"-->
        <!--                        :loading="suggestionLoading"-->
        <!--                        hide-no-data-->
        <!--                        hide-selected-->
        <!--                        append-icon="mdi-basket-plus-outline"-->
        <!--                        @click:append="createEntry()"-->
        <!--                        dense-->
        <!--        />-->
      </v-card-text>
    </v-card>

    <v-sheet outlined rounded class="mt-3 pa-2">
      <div
        v-if="shoppingList === null"
        class="d-flex justify-center align-items"
      >
        Loading
        <v-progress-circular
          color="primary" :size="25" :width="3" indeterminate
          class="ml-2"
        />
      </div>
      <div v-else>
        <TodoList
          label="Todo"
          :shopping-list="shoppingList"
          is-todo-list
          class="mb-4"
          @clear-done="clearDone"
          @check-entry="checkEntry"
          @rename-entry="renameEntry"
          @move-entry="moveEntry"
        />

        <TodoList
          label="Done"
          :shopping-list="shoppingList"
          @clear-done="clearDone"
          @check-entry="checkEntry"
          @rename-entry="renameEntry"
          @move-entry="moveEntry"
        />
      </div>
    </v-sheet>

    <!-- TODO: Change list name   -->
    <EventViewer
      v-if="shoppingList !== null"
      v-model="openLogDialog"
      :list-name="shoppingList.name"
      :events="events"
    />
  </div>
</template>

<script lang="ts" setup>
import {
  VBtn,
  VCard,
  VCardSubtitle,
  VCardText,
  VCardTitle,
  VIcon,
  VSheet,
  VTextField,
  VProgressCircular,
} from 'vuetify/components';
import EventViewer from '@/components/EventViewer.vue';
import TodoList from '@/components/TodoList.vue';
import feathersClient, { eventService, listService, User } from '@/feathers-client';
import ShoppingList, { IShoppingList, IShoppingListItem } from '@/shoppinglist/ShoppingList';
import { onMounted, Ref, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { Route } from '@/router';
import { useToast } from 'vue-toastification';
import { EventType, LogEvent, LogEventListenerData } from '@/shoppinglist/events';

const props = defineProps<{
  id: string | undefined,
}>();
const router = useRouter();
const toast = useToast();

const newItemField: Ref<VTextField | null> = ref(null);
const suggestedItems: Ref<string[]> = ref([]);
const suggestionSearch = ref('');
const suggestionLoading = ref(false);
const openLogDialog = ref(false);
const shoppingList: Ref<ShoppingList | null> = ref(null);
const newItemName = ref('');
const newItemRules = [
  (val: string) => val.trim().length >= 1 || 'Must at least have one character that isn\'t a space',
  (val: string) => val.trim().length <= 256 || 'Can\'t exceed 256 character limit!',
];
const user: Ref<null | User> = ref(null);
const events: Ref<LogEvent[]> = ref([]);
const connected = ref(feathersClient.io.connected);

onMounted(async () => {
  await connectionWatcher();
  await registerEventListener();
  registerSearch();

  events.value = loadStoredEvents();

  if (!feathersClient.io.connected.value) shoppingList.value = await loadListFromCache();
  shoppingList.value = await loadListFromRemote();

  user.value = await feathersClient.get('authentication').user.value;
});

//region register listeners
watch(connected.value, connectionWatcher);

function connectionWatcher() {
  if (feathersClient.io.connected.value) {
    sendEventsToServer();
    console.log('Sending events.value to server.');
  }
}

function registerEventListener() {
  feathersClient.service('event')
    .on('created', (data: LogEventListenerData) => {
      console.log('event shared', data);
      const event = data.eventData;

      if (!shoppingList.value) return;

      let foundEntry: IShoppingListItem | undefined;
      let foundEntryIndex = -1;
      shoppingList.value.entries.forEach((entry, i) => {
        if (entry.id === event.entryId) {
          foundEntry = entry;
          foundEntryIndex = i;
        }
      });

      switch (data.eventData.event) {
        case EventType.CREATE_ENTRY:
          if (foundEntry) return;

          newItemName.value = event.state.name;
          createEntry(false);
          break;

        case EventType.MARK_ENTRY_TODO:
          if (!foundEntry) return;
          if (!foundEntry.done) return;

          checkEntry(event.entryId, false, false);
          break;

        case EventType.MARK_ENTRY_DONE:
          if (!foundEntry) return;
          if (foundEntry.done) return;

          checkEntry(event.entryId, true, false);
          break;

        case EventType.CHANGED_ENTRY_NAME:
          if (!foundEntry) return;
          if (foundEntry.name === data.eventData.state.name) return;

          renameEntry(event.entryId, data.eventData.state.name, false);
          break;

        case EventType.DELETE_ENTRY:
          if (!foundEntry) return;

          if (!shoppingList.value) return;
          shoppingList.value.clearDone();
          break;

        case EventType.MOVE_ENTRY:
          if (!foundEntry) return;
          if (foundEntryIndex === event.state.newIndex) return;

          if (event.state.newIndex && event.state.oldIndex) moveEntry(event.state.newIndex, event.state.oldIndex, false);
          break;

        default:
          console.log('Couldn\'t create/edit entry. Reloading...');
          window.location.reload();
          break;
      }
    });
}

function registerSearch() {
  window.addEventListener('keydown', (e) => {
    if (e.key === '/') {
      e.preventDefault();
      console.log('shift+7 search open/close');
      // TODO: Implement search
    }
  });
}

//endregion

//region list loaders
async function loadListFromRemote(): Promise<ShoppingList> {
  const list: IShoppingList[] | null = (await listService.find({ query: { listid: props.id } })
    .catch(() => {
      listNotFound();
    }) as { data: IShoppingList[] })?.data;
  if (!list) await listNotFound();
  console.log(list[0].entries);

  return new ShoppingList(list[0].name, list[0].description, list[0].owner, list[0].entries.items);
}

async function loadListFromCache(): Promise<ShoppingList> {
  const lists = localStorage.getItem('lists');
  if (!lists) {
    console.log('Lists not found');
    localStorage.setItem('lists', JSON.stringify([]));
    throw await listNotFound();
  }

  const list = (JSON.parse(lists) as Array<IShoppingList>).find((l) => l.listid === props.id);
  if (!list) throw await listNotFound();

  return new ShoppingList(list.name, list.description, list.owner, list.entries.items);
}

async function listNotFound() {
  await router.push({ name: Route.LIST_NOT_FOUND });
}

//endregion

//region entry functions
async function clearDone(): Promise<void> {
  if (!shoppingList.value) return;

  const deleted = shoppingList.value.clearDone();

// eslint-disable-next-line no-restricted-syntax
  for (const entry of deleted) {
    // eslint-disable-next-line no-await-in-loop
    await recordEvent({
      event: EventType.DELETE_ENTRY,
      entryId: entry.id,
      isoDate: (new Date()).toISOString(),
      state: {
        name: entry.name,
      },
    });
  }
}

async function renameEntry(id: string, name: string | null = null, _recordEvent = true): Promise<void> {
  if (!shoppingList.value) return;

  const entry = shoppingList.value.entries.find((t) => t.id === id);
  if (!entry) return;

  if (name) entry.additional.editName = name;

  shoppingList.value.renameItem(entry.id, entry.additional.editName);

  if (!_recordEvent) return;
  await recordEvent({
    event: EventType.CHANGED_ENTRY_NAME,
    entryId: id,
    isoDate: (new Date()).toISOString(),
    state: {
      name: entry.name,
      done: entry.done,
    },
  });
}

async function moveEntry(index: number, oldIndex: number, _recordEvent = true): Promise<void> {
  if (!shoppingList.value) return;
  const aboveEntry = index === 0 ? null : shoppingList.value.entries[index - 1];
  const belowEntry = shoppingList.value.entries.length - 1 === index ? null : shoppingList.value.entries[index + 1];
  const entry = shoppingList.value.entries[index];

  if (!_recordEvent) return;
  await recordEvent({
    event: EventType.MOVE_ENTRY,
    entryId: entry.id,
    isoDate: (new Date()).toISOString(),
    state: {
      name: entry.name,
      aboveEntry: aboveEntry?.id,
      belowEntry: belowEntry?.id,
      oldIndex,
      newIndex: index,
    },
  });
}

async function createEntry(_recordEvent = true): Promise<void> {
  // Filters hidden characters
  // eslint-disable-next-line no-control-regex
  const name = newItemName.value.trim().replaceAll(/[^\x00-\x7F(?:\u00c4,.\-\\/ \u00e4\u00d6\u00f6\u00dc\u00fc\u00df)]/g, '');

  for (let i = 0; i < newItemRules.length; i++) {
    const rule = newItemRules[i];
    if (typeof rule(name) === 'string') {
      toast('Name needs at least 1 character!');
      return;
    }
  }

  if (!shoppingList.value) return;

  const item = shoppingList.value.createItem(newItemName.value);
  item.additional = {
    edit: false,
    editName: item.name,
    focused: false,
  };

  newItemName.value = '';
  newItemField.value?.resetValidation();

  if (!_recordEvent) return;
  await recordEvent({
    event: EventType.CREATE_ENTRY,
    entryId: item.id,
    isoDate: (new Date()).toISOString(),
    state: {
      name: item.name,
      done: item.done,
    },
  });
}

async function checkEntry(id: string, check = true, _recordEvent = true): Promise<void> {
  if (!shoppingList.value) return;

  const entry = shoppingList.value?.entries.find((t) => t.id === id);
  if (!entry) return;

  shoppingList.value.checkItem(id, check);

  if (!_recordEvent) return;
  await recordEvent({
    event: check ? EventType.MARK_ENTRY_DONE : EventType.MARK_ENTRY_TODO,
    entryId: entry.id,
    isoDate: (new Date()).toISOString(),
    state: {
      name: entry.name,
      done: check,
    },
  });
}

//endregion

//region event service
function loadStoredEvents(): Array<LogEvent> {
  let ls: string | null = localStorage.getItem(`events.value-${props.id}`);
  if (!ls) return [];

  ls = JSON.parse(ls || '');

  return ls as unknown as Array<LogEvent>;
}

async function recordEvent(event: LogEvent): Promise<unknown> {
  const stored = localStorage.getItem('lists');
  if (!stored) localStorage.setItem('lists', JSON.stringify([]));

  const lists = JSON.parse(stored || '[]') as Array<IShoppingList>;
  for (let i = 0; i < lists.length; i++) {
    if (lists[i].listid === props.id && shoppingList.value) {
      lists[i] = shoppingList.value.toInterface(lists[i].id);
    }
  }
  localStorage.setItem('lists', JSON.stringify(lists));

  console.log('[LOG]', event);
  events.value.push(event);

  localStorage.setItem(`events.value-${props.id}`, JSON.stringify(events.value));

  return sendEventsToServer();
}

async function sendEventsToServer(): Promise<unknown> {
  interface ServerEventData {
    listid: string,
    eventData: {
      event: EventType,
      entryId: string,
      state: {
        name: string,
        done: boolean,
      },
      isoDate: string,
    },
  }

  console.log('Sending events.value to server.');

  const data: ServerEventData[] = events.value.map((e) => ({
    listid: props.id,
    eventData: e,
  } as ServerEventData));

  return eventService.create(data)
    .then((d) => {
      console.log('[LOG] Sent event to server');
      events.value.splice(0, (d as Array<LogEvent>).length);
      localStorage.setItem(`events.value-${props.id}`, JSON.stringify(events.value));
    })
    .catch((e) => {
      console.log('[LOG] Can\'t send events.value to server! no-connection');
      throw e;
    });
}

//endregion

//region download list
function downloadList(): void {
  if (!shoppingList.value) return;
  let { name } = shoppingList.value;
  const obj = shoppingList.value;
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

//endregion

//region suggestion service
// TODO: Make actual API call
watch(suggestionSearch, suggestionAPICall);

function suggestionAPICall(val: string): void {
  suggestionLoading.value = true;
  suggestedItems.value = [];
  if (val) suggestedItems.value.push(val);

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
    suggestedItems.value.push(out);
    suggestionLoading.value = false;
  }, Math.random() * 10);
}

//endregion
</script>

<style scoped>
.header {
  color: #3b3b3b;
  font-size: 7rem;
  line-height: 6rem;
}
</style>
