<template>
  <div class="pt-4" style="max-width: 800px; margin: auto">
    <v-alert
      :model-value="!viewOnlyInfoAlertHidden && !whitelistedUserPermissions.canEditEntries"
      class="mb-4" closable
      density="compact" text="This list is view-only because you are missing permissions!" type="info" variant="outlined"
      @click:close="hideViewOnlyInfoAlert(true)"
    />

    <v-card variant="outlined">
      <v-card-title>
        <div class="d-flex align-center w-100">
          <div v-if="shoppingList !== null" :class="{ 'w-100': editingListInfo }">
            <div v-if="editingListInfo" style="width: 100%">
              <v-text-field
                v-model="temporaryData.listName"
                append-inner-icon="mdi-content-save"
                class="mt-2"
                color="primary"
                density="compact"
                label="List Name"
                style="width: 100%; height: 2.9rem"
                variant="outlined"
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
              color="primary" icon="mdi-text-box-outline" size="x-small" variant="text"
              @click="openLogDialog = true"
            />
            <v-btn
              color="primary" icon="mdi-download-outline" size="x-small" variant="text"
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

            <v-btn
              v-if="developmentBuild"
              color="primary" icon="mdi-test-tube" size="x-small" variant="text"
              @click="dummyFill"
            />
          </div>
        </div>
      </v-card-title>
      <v-card-subtitle :style="editingListInfo ? 'opacity: 100% !important' : ''">
        <div v-if="shoppingList !== null">
          <div v-if="editingListInfo" style="width: 100%">
            <v-text-field
              v-model="temporaryData.listDescription"
              append-inner-icon="mdi-content-save"
              class="mt-2 mb-2"
              color="primary"
              density="compact"
              label="List Description"
              style="width: 100%; height: 2.9rem"
              variant="outlined"
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
        <v-form ref="newItemForm" v-model="entryNameValid"
                :disabled="!whitelistedUserPermissions.canEditEntries"
                @submit.prevent="createEntry()"
        >
          <v-text-field
            v-model="newItemName"
            :rules="newItemRules"
            append-inner-icon="mdi-basket-plus-outline"
            color="primary"
            density="comfortable"
            placeholder="Add item"
            variant="outlined"
            @blur="newItemName.length === 0 ? newItemForm?.resetValidation() : null"
            @click:append-inner="createEntry()"
          />
        </v-form>
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
          :user-permissions="whitelistedUserPermissions"
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
          :user-permissions="whitelistedUserPermissions"
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
  VAlert,
  VBtn,
  VCard,
  VCardSubtitle,
  VCardText,
  VCardTitle,
  VForm,
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
import ShareDialog, { UserPermissions, UserWhitelist } from '@/components/ShareDialog.vue';
import { v4 as uuidv4 } from 'uuid';
import { userInjection } from '@/helpers/injectionKeys';
import store from '@/helpers/offlineStore';
import { ReactiveVariable } from 'vue/macros';

const props = defineProps<{
  id: string | undefined,
}>();

const router = useRouter();
const toast = useToast();

const developmentBuild = ref(import.meta.env.DEV);
const newItemForm: Ref<VForm | null> = ref(null);

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

const entryNameValid: Ref<boolean | null> = ref(false);
const newItemName = ref('');
const newItemRules = ref([
  (val: string) => val.trim().length <= 256 || 'Can\'t exceed 256 character limit!',
]);

const connected = ref(feathersClient.io.connected);

const events: Ref<EventData[]> = ref([]);
const historicalEvents: Ref<EventData[]> = ref([]);
const sessionId = uuidv4();
const user = inject(userInjection);
const whitelistedUserPermissions = ref({
  canEditEntries: true,
  canDeleteEntries: true,
} as UserPermissions);
const viewOnlyInfoAlertHidden = ref(false);

feathersClient.io.on('disconnect', () => {
  connected.value = false;
});

onMounted(async () => {
  await connectionWatcher();
  registerEventListener();
  registerListInfoChangeListener();
  registerWhitelistListeners();
  registerSearch();

  events.value = loadStoredEvents();

  if (connected.value) {
    shoppingList.value = await loadListFromRemoteOrStore();
    if (shoppingList.value != null) await updatePermissions();
  } else {
    shoppingList.value = await loadListFromCache();
  }

  // Reload list from remote every 5 minutes to sync everything again
  setInterval(async () => shoppingList.value = await loadListFromRemoteOrStore(), 1000 * 60 * 5 /* 5 Minutes */);

  viewOnlyInfoAlertHidden.value = getViewInfoAlertHideStateFromStore();
});

//region register listeners
watch(connected, connectionWatcher);

async function connectionWatcher() {
  if (feathersClient.io.connected) {
    await sendEventsToServer();
  }
}

function registerListInfoChangeListener() {
  feathersClient.service(Service.LIST).on('patched', (patchedList: IShoppingList) => {
    if (!shoppingList.value) return;
    if (shoppingList.value?.listid !== patchedList.listid) return;

    shoppingList.value.name = patchedList.name;
    shoppingList.value.description = patchedList.description;
  });
}

function registerWhitelistListeners() {
  feathersClient.service(Service.WHITELISTED_USERS).once('removed', (removed: UserWhitelist) => {
    if (shoppingList.value?.listid !== removed.listId) return;
    window.location.reload();
  });

  feathersClient.service(Service.WHITELISTED_USERS).on('patched', async (patchedUser: UserWhitelist) => {
    if (user && user.uuid === shoppingList.value?.owner) return;
    if (shoppingList.value?.listid !== patchedUser.listId) return;
    await updatePermissions(patchedUser);
    hideViewOnlyInfoAlert(false);
  });
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
    if (shoppingList.value?.listid !== data.listid) return;

    const entry = shoppingList.value?.findEntryGlobal((value) => value.id === event.entryId);
    if (!entry && data.eventData.event !== EventType.CREATE_ENTRY) return;

    switch (data.eventData.event) {
      case EventType.CREATE_ENTRY:
        await createEntry(event.state.name, event.entryId, false, false);
        break;

      case EventType.MARK_ENTRY_TODO:
        await checkEntry(event.entryId, false, false);
        break;

      case EventType.MARK_ENTRY_DONE:
        await checkEntry(event.entryId, true, false);
        break;

      case EventType.CHANGED_ENTRY_NAME:
        if (entry != undefined && entry.name === data.eventData.state.name) return;

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
      // e.preventDefault();
      console.log('TODO: shift+7 search open/close');
      // TODO: Implement search
    }
  });
}

//endregion

//region list loaders
async function reloadList(): Promise<void> {
  shoppingList.value = await loadListFromRemoteOrStore();
}

async function loadListFromRemoteOrStore(): Promise<ShoppingList | null> {
  if (!user || !connected.value) return await loadListFromCache();

  try {
    const list: IShoppingList[] | undefined = await feathersClient.service(Service.LIST)
      .find({ query: { listid: props.id } })
      .catch(console.error);
    if (list == undefined || list.length <= 0) return await loadListFromCache();

    await store.tryPutShoppingList(list[0]);
    return new ShoppingList(list[0].listid, list[0].name, list[0].description, list[0].owner, list[0].entries, list[0].checkedEntries, list[0].id);
  } catch (e) {
    return await loadListFromCache();
  }
}

async function loadListFromCache(): Promise<ShoppingList> {
  console.log('[STORE] Loading list from store');
  const cachedList = await store.db?.getFromIndex('shopping-list', 'by-listid', props.id ?? ''); //localStorage.getItem('lists');
  if (cachedList === undefined) throw await listNotFound();
  return new ShoppingList(cachedList.listid, cachedList.name, cachedList.description, cachedList.owner, cachedList.entries, cachedList.checkedEntries);
}

async function listNotFound() {
  await router.push({ name: Route.LIST_NOT_FOUND });
}

//endregion

//region entry event emitters
async function clearDone(): Promise<void> {
  if (!shoppingList.value) return;

  const deleted = shoppingList.value?.clearDone();
  if (!deleted || deleted.length <= 0) return;

  await recordEvent({
    event: EventType.CLEAR_DONE,
    entryId: deleted[0].id,
    isoDate: (new Date()).toISOString(),
    state: {
      name: 'unknown',
    },
  });
}

async function renameEntry(id: string, name: string | null = null, _recordEvent = true): Promise<void> {
  if (!shoppingList.value) return;

  const entry = shoppingList.value?.globalEntries.find((t) => t.id === id);
  if (!entry) return;

  if (name) entry.additional.editName = name;
  if (entry.additional.editName.trim().length === 0) {
    entry.additional.editName = entry.name;
    return;
  }

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

async function createEntry(_entryName: string | null = null, id = uuidv4(), resetVar = true, _recordEvent = true): Promise<void> {
  const entryName = _entryName?.trim() ?? newItemName.value.trim();
  if (!entryName) return;
  if (!shoppingList.value) return;

  if (entryNameValid.value === null) entryNameValid.value = (await newItemForm.value?.validate())?.valid ?? false;
  if (!entryNameValid.value) return;

  const entry = shoppingList.value?.createItem(entryName, id);
  entry.additional = {
    edit: false,
    editName: entry.name,
    focused: false,
  };

  if (resetVar) newItemName.value = '';

  if (!_recordEvent) return;
  await recordEvent({
    event: EventType.CREATE_ENTRY,
    entryId: entry.id,
    isoDate: (new Date()).toISOString(),
    state: {
      name: entry.name,
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

async function recordEvent(event: Omit<EventData, 'storeId'>): Promise<unknown> {
  const stored = localStorage.getItem('lists');
  if (!stored) localStorage.setItem('lists', JSON.stringify([]));

  const lists = JSON.parse(stored || '[]') as Array<IShoppingList>;
  for (let i = 0; i < lists.length; i++) {
    if (lists[i].listid === props.id && shoppingList.value) {
      lists[i] = shoppingList.value?.toInterface(lists[i].id);
    }
  }

  if (shoppingList.value !== null) {
    await store.tryPutShoppingList(removeProxy(shoppingList.value?.toInterface()));
  }

  localStorage.setItem('lists', JSON.stringify(lists));

  console.log('[EVENT]', event);
  events.value.push({
    storeId: undefined,
    ...event
  });
  historicalEvents.value.push({
    storeId: undefined,
    ...event
  });

  const eventIds = await store.tryPutEvents(removeProxy(events.value));
  console.log('eventIDs', eventIds);
  events.value.forEach((e, i) => {
    if (eventIds[i] === undefined) return;
    e.storeId = eventIds[i] as number;
  });

  localStorage.setItem(`events.value-${props.id}`, JSON.stringify(events.value));

  return sendEventsToServer();
}

function removeProxy<T>(o: ReactiveVariable<T>): T {
  return JSON.parse(JSON.stringify(o));
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

  const removeQueueEvent = async (d: LogEvent[]) => {
    const tx = store.db?.transaction('event', 'readwrite');

    const promises: (Promise<void> | undefined)[] = [];
    d.forEach((event) => promises.push(tx?.store.delete(event.eventData.storeId ?? -1)));

    promises.push(tx?.done);
    await Promise.all(promises);

    events.value.splice(0, d.length);
    localStorage.setItem(`events.value-${props.id}`, JSON.stringify(events.value));
  };

  return feathersClient.service(Service.EVENT).create(data)
    .then(async (d) => {
      console.log('[LOG] Sent event to server');
      await removeQueueEvent(d);
    })
    .catch(async (e) => {
      console.log('[LOG] Error sending events.value to server!');
      switch ((e as FeathersError).code) {
        case 403:
          console.log('Not permitted to send this type of event!');
          toast.warning('You are not permitted to do this action!');
          await removeQueueEvent(data);
          await reloadList();
          break;

        case 404:
          console.log('Unable to find entry. This can probably be ignored and does not affect normal usage.', e);
          await removeQueueEvent(data);
          await reloadList(); // just to be sure
          break;

        default:
          throw e;
      }
    });
}

//endregion

//region list utils
async function dummyFill() {
  for (let i = 0; i < 25; i++) {
    await createEntry(i.toString());
  }
  return false;
}

const VIEW_ONLY_INFO_ALERT_STORE = 'viewOnlyInfoAlert';

interface ViewOnlyInfoAlertStore {
  hidden: boolean,
  listId: string,
}

function hideViewOnlyInfoAlert(hide = true): ViewOnlyInfoAlertStore {
  if (!shoppingList.value) {
    return {
      hidden: false,
      listId: '',
    };
  }

  const raw = localStorage.getItem(VIEW_ONLY_INFO_ALERT_STORE);
  let data: ViewOnlyInfoAlertStore[];
  if (raw == null) {
    data = [];
  } else {
    data = JSON.parse(raw);
  }

  const index = data.findIndex(d => d.listId === shoppingList.value?.listid);

  const insertionState = {
    hidden: hide,
    listId: shoppingList.value?.listid,
  };

  if (index === -1) {
    data.push(insertionState);
  } else {
    data[index] = insertionState;
  }

  localStorage.setItem(VIEW_ONLY_INFO_ALERT_STORE, JSON.stringify(data));
  viewOnlyInfoAlertHidden.value = hide;

  return insertionState;
}

function getViewInfoAlertHideStateFromStore() {
  const rawState = localStorage.getItem(VIEW_ONLY_INFO_ALERT_STORE);
  if (rawState == null) return hideViewOnlyInfoAlert(false).hidden;

  const state: ViewOnlyInfoAlertStore[] = JSON.parse(rawState);
  return state.find(s => s.listId === shoppingList.value?.listid)?.hidden ?? hideViewOnlyInfoAlert(false)?.hidden;
}

async function updatePermissions(whitelistedUser: UserWhitelist | null = null) {
  if (shoppingList.value && shoppingList.value?.owner === user?.uuid) return;

  let whitelisted = [whitelistedUser];
  if (!whitelistedUser) {
    whitelisted = await feathersClient.service(Service.WHITELISTED_USERS).find({
      query: {
        listId: shoppingList.value?.listid,
      },
    }) as UserWhitelist[];
  }
  if (whitelisted.length > 0) {
    whitelistedUserPermissions.value.canEditEntries = whitelisted[0]?.canEditEntries || false;
    whitelistedUserPermissions.value.canDeleteEntries = whitelisted[0]?.canDeleteEntries || false;
  }
}

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

  const dataStr = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(shoppingList.value?.toInterface(-1)))}`;
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
