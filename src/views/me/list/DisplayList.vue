<template>
  <div class="mt-4" style="max-width: 800px; margin: auto">
    <v-card variant="outlined">
      <v-card-title>
        <div class="d-flex align-center w-100">
          <div v-if="shoppingList !== null" :class="{ 'w-100': editingListInfo }">
            <div v-if="editingListInfo" style="width: 100%">
              <v-text-field
                v-model="temporaryData.listName"
                class="mt-2"
                style="width: 100%; height: 2.9rem"
                variant="outlined"
                label="List Name"
                density="compact"
                color="primary"
                append-inner-icon="mdi-content-save"
                @click:append-inner="setListInfo()"
                @keydown.enter="setListInfo()"
              />
            </div>
            <span v-else>
              {{ shoppingList.name }}
            </span>
          </div>
          <div v-else>
            Working on it...
          </div>

          <div v-if="!editingListInfo">
            <v-btn
              v-show="shoppingList != null && user != undefined && shoppingList.owner === user.uuid"
              color="primary" icon="mdi-pencil-outline" size="x-small" variant="text"
              @click="enterListInfoEditState()"
            />

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
              @click="reloadList"
            />

            <v-btn
              v-show="shoppingList != null && user != undefined && shoppingList.owner === user.uuid"
              color="primary" icon="mdi-account-group-outline" size="x-small" variant="text"
              @click="openShareDialog = true"
            />
          </div>
        </div>
      </v-card-title>
      <v-card-subtitle :style="editingListInfo ? 'opacity: 100% !important' : ''">
        <div v-if="shoppingList !== null">
          <div v-if="editingListInfo" style="width: 100%">
            <v-text-field
              v-model="temporaryData.listDescription"
              class="mt-2 mb-2"
              style="width: 100%; height: 2.9rem"
              variant="outlined"
              label="List Description"
              density="compact"
              color="primary"
              append-inner-icon="mdi-content-save"
              @click:append-inner="setListInfo()"
              @keydown.enter="setListInfo()"
            />
          </div>
          <div v-else>
            {{ shoppingList.description }}
          </div>
        </div>
        <div v-else>
          Working on it...
        </div>
      </v-card-subtitle>

      <v-card-text v-if="!editingListInfo" class="mb-0 pb-0">
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

    <v-card class="mt-3 pa-2" rounded variant="outlined">
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

    <ShareDialog
      v-if="shoppingList != null && user != undefined && shoppingList.owner === user.uuid"
      v-model="openShareDialog"
      :list-id="(shoppingList as ShoppingList).listid"
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
import feathersClient, { FeathersError, Service } from '@/feathers-client';
import ShoppingList, { IShoppingList } from '@/shoppinglist/ShoppingList';
import { inject, onMounted, reactive, Ref, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { Route } from '@/router';
import { useToast } from 'vue-toastification';
import { EventData, EventType, LogEvent, LogEventListenerData } from '@/shoppinglist/events';
import ShareDialog from '@/components/ShareDialog.vue';
import { v4 as uuidv4 } from 'uuid';
import { userInjection } from '@/helpers/injectionKeys';

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
const openShareDialog = ref(false);
const editingListInfo = ref(false);
const temporaryData = reactive({
  listName: '',
  listDescription: '',
});

const shoppingList: Ref<ShoppingList | null> = ref(null);

const newItemName = ref('');
const newItemRules = [
  (val: string) => val.trim().length >= 1 || 'Must at least have one character that isn\'t a space',
  (val: string) => val.trim().length <= 256 || 'Can\'t exceed 256 character limit!',
];

const connected = ref(feathersClient.io.connected);

const events: Ref<EventData[]> = ref([]);
const historicalEvents: Ref<EventData[]> = ref([]);
const sessionId = uuidv4();
const user = inject(userInjection);

onMounted(async () => {
  await connectionWatcher();
  registerEventListener();
  registerSearch();

  events.value = loadStoredEvents();

  if (connected.value) {
    shoppingList.value = await loadListFromRemote();
  } else {
    shoppingList.value = await loadListFromCache();
  }

  feathersClient.service(Service.LIST).on('patched', (patchedList: IShoppingList) => {
    if (!shoppingList.value) return;
    shoppingList.value.name = patchedList.name;
    shoppingList.value.description = patchedList.description;
  });

  feathersClient.service(Service.WHITELISTED_USERS).once('removed', () => {
    window.location.reload();
  });
});

//region register listeners
watch(connected, connectionWatcher);

async function connectionWatcher() {
  if (feathersClient.io.connected) {
    await sendEventsToServer();
  }
}

function registerEventListener() {
  feathersClient.service('event').on('created', async (data: LogEventListenerData) => {
    const event = data.eventData;
    if (event.sender === sessionId) {
      console.log('ignoring event because it was sent from this client');
      return;
    }

    historicalEvents.value.push(data.eventData);

    if (!shoppingList.value) return;
    const entry = shoppingList.value?.findEntryGlobal((value) => value.id === event.entryId);
    if (!entry && data.eventData.event !== EventType.CREATE_ENTRY) return;

    switch (data.eventData.event) {
      case EventType.CREATE_ENTRY:
        newItemName.value = event.state.name;
        await createEntry(false);
        break;

      case EventType.MARK_ENTRY_TODO:
        await checkEntry(event.entryId, false, false);
        break;

      case EventType.MARK_ENTRY_DONE:
        await checkEntry(event.entryId, true, false);
        break;

      case EventType.CHANGED_ENTRY_NAME:
        if (entry.name === data.eventData.state.name) return;

        await renameEntry(event.entryId, data.eventData.state.name, false);
        break;

      case EventType.DELETE_ENTRY:
        if (!shoppingList.value) return;
        shoppingList.value.clearDone();
        break;

      case EventType.MOVE_ENTRY:
        if (event.state.newIndex != undefined && event.state.oldIndex != undefined) await moveEntry(event.state.newIndex, event.state.oldIndex, false, false);
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
async function reloadList(): Promise<void> {
  shoppingList.value = await loadListFromRemote();
}

async function loadListFromRemote(): Promise<ShoppingList | null> {
  if (!user) return null;

  const list: IShoppingList[] | null = await feathersClient.service(Service.LIST).find({ query: { listid: props.id } })
    .catch(() => {
      listNotFound();
    }) as IShoppingList[] | null;
  if (list == null) {
    await listNotFound();
    return null;
  }

  console.log(list);

  return new ShoppingList(list[0].listid, list[0].name, list[0].description, list[0].owner, list[0].entries, list[0].checkedEntries);
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

  return new ShoppingList(list.listid, list.name, list.description, list.owner, list.entries, list.checkedEntries);
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
    },
  });
}

async function moveEntry(index: number, oldIndex: number, _recordEvent = true, moveAlreadyHandled = true): Promise<void> {
  if (!shoppingList.value) return;

  let entry = shoppingList.value.entries[index];
  if (!moveAlreadyHandled) {
    entry = shoppingList.value.entries[oldIndex];
    shoppingList.value.entries.splice(oldIndex, 1);
    shoppingList.value.entries.splice(index, 0, entry);
  }

  if (!_recordEvent) return;
  await recordEvent({
    event: EventType.MOVE_ENTRY,
    entryId: entry.id,
    isoDate: (new Date()).toISOString(),
    state: {
      name: entry.name,
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
      sender: sessionId,
    },
  } as LogEvent));

  console.log(data);

  const removeQueueEvent = (d: LogEvent[]) => {
    events.value.splice(0, d.length);
    localStorage.setItem(`events.value-${props.id}`, JSON.stringify(events.value));
  };

  return feathersClient.service(Service.EVENT).create(data)
    .then((d) => {
      console.log('[LOG] Sent event to server');
      removeQueueEvent(d);
    })
    .catch((e) => {
      console.log('[LOG] Can\'t send events.value to server!');
      if ((e as FeathersError).code === 403) {
        console.log('Not permitted to send this type of event!');
        toast.warning('You are not permitted to do this action!');
        removeQueueEvent(data);
        reloadList();
      } else {
        throw e;
      }
    });
}

//endregion

//region list utils
function enterListInfoEditState() {
  temporaryData.listName = shoppingList.value?.name ?? 'Error';
  temporaryData.listDescription = shoppingList.value?.description ?? 'Error';

  editingListInfo.value = true;
}

async function setListInfo() {
  if (!shoppingList.value) return;
  shoppingList.value.name = temporaryData.listName;
  shoppingList.value.description = temporaryData.listDescription;

  editingListInfo.value = false;

  await sendListInfoChangeToServer();
}

async function sendListInfoChangeToServer() {
  if (!shoppingList.value) return;

  await feathersClient.service('list').patch(null, {
    name: shoppingList.value.name,
    description: shoppingList.value.description,
  } as Partial<IShoppingList>, {
    query: {
      listid: shoppingList.value.listid
    }
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
