<template>
  <div class="mt-4" style="max-width: 800px; margin: auto">
    <v-card variant="outlined">
      <v-card-title>
        <div class="d-flex align-center">
          <div v-if="shoppingList !== null">
            {{ shoppingList.name }}
          </div>
          <div v-else>
            Working on it...
          </div>

          <v-btn
            color="primary" icon="mdi-text-box" size="x-small" variant="text"
            @click="openLogDialog = true"
          />
          <v-btn
            color="primary" icon="mdi-download" size="x-small" variant="text"
            @click="downloadList"
          />
          <v-btn
            color="primary" icon="mdi-refresh" size="x-small" variant="text"
            @click="loadListFromRemote"
          />
        </div>
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
          :rules="newItemRules"
          append-inner-icon="mdi-basket-plus-outline"
          color="primary"
          density="comfortable"
          placeholder="Add item"
          variant="outlined"
          @blur="newItemName.length === 0 ? newItemField?.resetValidation() : null"
          @click:append-inner="createEntry"
          @keydown.enter="createEntry"
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

    <v-card class="mt-3 pa-2" variant="outlined" rounded>
      <div
        v-if="shoppingList === null"
        class="d-flex justify-center align-items"
      >
        Loading
        <v-progress-circular
          :size="25" :width="3" class="ml-2" color="primary"
          indeterminate
        />
      </div>
      <div v-else>
        <TodoList
          v-model="shoppingList.entries"
          class="mb-4"
          is-movable
          label="Todo"
          show-count
          @clear-done="clearDone"
          @check-entry="checkEntry"
          @rename-entry="renameEntry"
          @move-entry="moveEntry"
        />

        <TodoList
          v-model="shoppingList.checkedEntries"
          checked-state
          is-clearable
          label="Done"
          @clear-done="clearDone"
          @check-entry="checkEntry"
          @rename-entry="renameEntry"
          @move-entry="moveEntry"
        />
      </div>
    </v-card>

    <!-- TODO: Change list name   -->
    <EventViewer
      v-if="shoppingList !== null"
      id="eventViewer"
      v-model="openLogDialog"
      :events="historicalEvents"
      :list-name="shoppingList.name"
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
  VProgressCircular,
  VTextField,
} from 'vuetify/components';
import EventViewer from '@/components/EventViewer.vue';
import TodoList from '@/components/TodoList.vue';
import feathersClient, { eventService, listService, User } from '@/feathers-client';
import ShoppingList, { IShoppingList, IShoppingListItem } from '@/shoppinglist/ShoppingList';
import { onMounted, Ref, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { Route } from '@/router';
import { useToast } from 'vue-toastification';
import { EventData, EventType, LogEvent, LogEventListenerData } from '@/shoppinglist/events';

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
const connected = ref(feathersClient.io.connected);
const events: Ref<EventData[]> = ref([]);
const historicalEvents: Ref<EventData[]> = ref([]);

onMounted(async () => {
  await connectionWatcher();
  registerEventListener();
  registerSearch();

  events.value = loadStoredEvents();

  if (connected.value) {
    shoppingList.value = await loadListFromRemote();
    user.value = await feathersClient.get('authentication').user;
  } else {
    shoppingList.value = await loadListFromCache();
  }
});

//region register listeners
watch(connected, connectionWatcher);

async function connectionWatcher() {
  if (feathersClient.io.connected.value) {
    user.value = await feathersClient.get('authentication').user;
    await sendEventsToServer();
  }
}

function registerEventListener() {
  feathersClient.service('event').on('created', (data: LogEventListenerData) => {
    const event = data.eventData;
    if (event.sender == user.value?.uuid) {
      console.log('ignoring event because it was sent from this client');
      return;
    }
    console.log('event received', data);

    if (!shoppingList.value) return;

    let foundEntry: IShoppingListItem | undefined;
    let foundEntryIndex = -1;
    shoppingList.value?.entries.forEach((entry, i) => {
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
      console.log('TODO: shift+7 search open/close');
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

  return new ShoppingList(list[0].name, list[0].description, list[0].owner, list[0].entries.items, list[0].checkedEntries.items);
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

  return new ShoppingList(list.name, list.description, list.owner, list.entries.items, list.checkedEntries.items);
}

async function listNotFound() {
  await router.push({ name: Route.LIST_NOT_FOUND });
}

//endregion

//region entry event emitters
async function clearDone(): Promise<void> {
  if (!shoppingList.value) return;

  const deleted = shoppingList.value?.clearDone();

// eslint-disable-next-line no-restricted-syntax
  for (const entry of deleted) {
    // eslint-disable-next-line no-await-in-loop
    await recordEvent({
      event: EventType.DELETE_ENTRY,
      entryId: entry.id,
      isoDate: (new Date()).toISOString(),
      state: {
        name: entry.name,
        done: true,
      },
    });
  }
}

async function renameEntry(id: string, name: string | null = null, _recordEvent = true): Promise<void> {
  if (!shoppingList.value) return;

  const entry = shoppingList.value.entries.find((t) => t.id === id);
  if (!entry) return;

  if (name) entry.additional.editName = name;

  shoppingList.value?.renameItem(entry.id, entry.additional.editName);

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
  const entry = shoppingList.value.entries[index];

  if (!_recordEvent) return;
  await recordEvent({
    event: EventType.MOVE_ENTRY,
    entryId: entry.id,
    isoDate: (new Date()).toISOString(),
    state: {
      name: entry.name,
      done: entry.done,
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

  const entry = shoppingList.value?.findEntryGlobal((t) => t.id === id);
  if (!entry) return;

  shoppingList.value?.checkItem(id, check);

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
function loadStoredEvents(): Array<EventData> {
  let ls: string | null = localStorage.getItem(`events.value-${props.id}`);
  if (!ls) return [];

  ls = JSON.parse(ls || '');

  return ls as unknown as Array<EventData>;
}

async function recordEvent(event: EventData): Promise<unknown> {
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
  historicalEvents.value.push(event);

  localStorage.setItem(`events.value-${props.id}`, JSON.stringify(events.value));

  return sendEventsToServer();
}

async function sendEventsToServer(): Promise<unknown> {
  console.log('Sending events.value to server.');

  const data: LogEvent[] = events.value.map((e) => ({
    listid: props.id,
    eventData: {
      ...e,
      sender: user.value?.uuid,
    },
  } as LogEvent));

  return eventService.create(data)
    .then((d) => {
      console.log('[LOG] Sent event to server');
      events.value.splice(0, (d as Array<LogEvent>).length);
      localStorage.setItem(`events.value-${props.id}`, JSON.stringify(events.value));
    })
    .catch((e) => {
      console.log('[LOG] Can\'t send events.value to server!');
      throw e;
    });
}

//endregion

//region download list
function downloadList(): void {
  if (!shoppingList.value) return;
  let { name } = shoppingList.value;
  const fileType = 'json';

  name.trim().replaceAll(' ', '_');
  name += '-export';

  const dataStr = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(shoppingList.value))}`;
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
    if (!out) return;
    suggestedItems.value.push(out);
    suggestionLoading.value = false;
  }, Math.random() * 10);
}

//endregion
</script>
