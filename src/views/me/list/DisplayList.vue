<template>
  <div class="pt-4" style="max-width: 800px; margin: auto">
    <v-alert
      :model-value="!viewOnlyInfoAlertHidden && !whitelistedUserPermissions.canEditEntries"
      class="mb-4" closable
      density="compact" text="This list is view-only because you are missing permissions!"
      type="info" variant="outlined"
      @click:close="hideViewOnlyInfoAlert(true)"
    />

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
              v-show="shoppingList != null && loginStore.user != undefined && shoppingList.owner === loginStore.user.uuid"
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
              @click="loadList"
            />

            <v-btn
              v-show="shoppingList != null && loginStore.user != undefined && shoppingList.owner === loginStore.user.uuid"
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
          class="mb-4"
          is-movable
          label="Todo"
          show-count
          :user-permissions="whitelistedUserPermissions"
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
          :user-permissions="whitelistedUserPermissions"
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
      :events="eventsStore.getByListId(props.id!)"
      :list-name="shoppingList.name"
    />

    <ShareDialog
      v-if="shoppingList != null && loginStore.user != undefined && shoppingList.owner === loginStore.user.uuid"
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
import { onMounted, reactive, Ref, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { Route } from '@/router';
import { useToast } from 'vue-toastification';
import { EventData, EventType, LogEvent, LogEventListenerData } from '@/shoppinglist/events';
import ShareDialog, { UserPermissions, UserWhitelist } from '@/components/ShareDialog.vue';
import { v4 as uuidv4 } from 'uuid';
import { useLibraryStore } from '@/stores/library.store';
import { useEventsStore } from '@/stores/events.store';
import { useLoginStore } from '@/stores/login.store';

const props = defineProps<{
  id: string | undefined,
}>();

const router = useRouter();
const toast = useToast();

const libraryStore = useLibraryStore();
const eventsStore = useEventsStore();
const loginStore = useLoginStore();

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

const sessionId = uuidv4();
const whitelistedUserPermissions = ref({
  canEditEntries: true,
  canDeleteEntries: true,
} as UserPermissions);
const viewOnlyInfoAlertHidden = ref(false);

feathersClient.io.on('disconnect', () => {
  console.log('[feathersClient] disconnected!');
  connected.value = false;
});

feathersClient.io.on('connect', async () => {
  console.log('[feathersClient] connected!');
  connected.value = true;
  await sendEventsToServer();
})

onMounted(async () => {
  await sendEventsToServer();
  registerEventListener();
  registerListInfoChangeListener();
  registerWhitelistListeners();
  registerSearch();

  await loadList();

  // Reload list from remote every 5 minutes to sync everything again
  setInterval(async () => shoppingList.value = await loadListFromRemote(), 1000 * 60 * 5 /* 5 Minutes */);

  viewOnlyInfoAlertHidden.value = getViewInfoAlertHideStateFromStore();
});

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
    if (loginStore.user && loginStore.user.uuid === shoppingList.value?.owner) return;
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
async function loadList(): Promise<void> {
  if (connected.value) {
    shoppingList.value = await loadListFromRemote();
    if (shoppingList.value != null) await updatePermissions();
    return;
  }

  shoppingList.value = await loadListFromCache();
}

async function loadListFromRemote(): Promise<ShoppingList | null> {
  if (!loginStore.loggedIn) return null;

  const list: IShoppingList[] | undefined = await feathersClient.service(Service.LIST).find({ query: { listid: props.id } })
    .catch(() => {
      listNotFound();
    }) as IShoppingList[] | undefined;
  if (list == undefined || list.length <= 0) {
    await listNotFound();
    return null;
  }

  console.log(list);

  return new ShoppingList(list[0].listid, list[0].name, list[0].description, list[0].owner, list[0].entries, list[0].checkedEntries);
}

async function loadListFromCache(): Promise<ShoppingList> {
  if (!props.id) throw await listNotFound();

  const list = libraryStore.getListById(props.id);
  if (list === null) throw await listNotFound();
  return new ShoppingList(list.listid, list.name, list.description, list.owner, list.entries, list.checkedEntries);
}

async function listNotFound() {
  await router.replace({ name: Route.LIST_NOT_FOUND });
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
async function recordEvent(event: EventData): Promise<unknown> {
  if (!props.id) throw new Error('props.id not defined (@ recordEvent)!');
  if (!shoppingList.value) throw new Error('shoppingList is not defined (@ recordEvent)!)');
  libraryStore.patchById(props.id, shoppingList.value.toInterface());

  console.log('[EventService]', event);
  eventsStore.pushEvent(props.id, event);
  return sendEventsToServer();
}

async function sendEventsToServer(): Promise<unknown> {
  console.log('Sending events.value to server.');

  const data: LogEvent[] = eventsStore.getAsLogEvents(props.id!, sessionId);
  console.log('[EventService] ', data);

  return feathersClient.service(Service.EVENT).create(data)
    .then(async (d) => {
      console.log('[EventService] Sent event to server');
      eventsStore.getByListId(props.id!).splice(0, d.length);
    })
    .catch(async (e) => {
      console.log('[EventService] Error sending events.value to server!');
      switch ((e as FeathersError).code) {
        case 403:
          console.log('Not permitted to send this type of event!');
          toast.warning('You are not permitted to do this action!');
          eventsStore.getByListId(props.id!).splice(0, data.length);
          await loadList();
          break;

        case 404:
          console.log('Unable to find entry. This can probably be ignored and does not affect normal usage.', e);
          eventsStore.getByListId(props.id!).splice(0, data.length);
          await loadList(); // just to be sure
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
  if (shoppingList.value && shoppingList.value?.owner === loginStore.user?.uuid) return;

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
