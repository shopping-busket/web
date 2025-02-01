<template>
  <v-card
    title="Busket Backend tester" :subtitle="`You are logged in as ${loginStore.user?.fullName}`"
    class="mt-16 ma-auto" max-width="800px" variant="outlined" :style="jseThemeCSS"
    :class="getJseTheme"
  >
    <v-card-text>
      <v-btn
        density="compact" color="primary" variant="outlined" block class="mb-5"
        @click="openGenerateEventDialog"
      >
        Generate List Event
      </v-btn>

      <v-form ref="form" v-model="isValid" @submit.prevent="send">
        <v-combobox
          v-model="selectedService" required density="compact" variant="underlined"
          label="Service" :items="services" :rules="[rules.requiredField]"
        />
        <v-autocomplete
          v-model="selectedMethod" required density="compact" variant="underlined"
          label="Method" :items="methods" :rules="[rules.requiredField]"
        />

        <v-text-field
          v-if="methodArgsMap[selectedMethod].includes('id')"
          v-model.number="reqId"
          :rules="[rules.requiredId, rules.hasToBeNum]"
          type="number"
          label="ID"
          variant="underlined"
          density="compact"
        />

        <div v-if="methodArgsMap[selectedMethod].includes('data')" class="mb-6">
          Data
          <json-editor-vue
            v-model="reqData" class="jse-border-rounded" mode="text" :status-bar="false"
            style="height: 17rem"
          />
        </div>

        <div v-if="methodArgsMap[selectedMethod].includes('params')">
          Params
          <json-editor-vue
            v-model="reqParams" class="jse-border-rounded" mode="text" :status-bar="false"
            style="height: 17rem"
          />
        </div>

        <v-btn type="submit" color="primary" block variant="tonal" class="my-4">
          Send
        </v-btn>

        Response
        <json-editor-vue
          ref="responseEditor"
          v-model="response" class="jse-border-rounded" mode="tree"
          style="height: 40rem" read-only
          :flatten-columns="true"
        />
        <span style="opacity: 70%">Tip: You can view the response JSON in fullscreen mode by pressing f (close with f or esc)</span>
      </v-form>
    </v-card-text>
  </v-card>

  <v-dialog v-model="showResponseDialog" fullscreen :style="jseThemeCSS" :class="getJseTheme">
    <json-editor-vue
      ref="responseEditorFullscreen"
      v-model="response" mode="tree" style="height: 100%" read-only
      :flatten-columns="true"
    />
  </v-dialog>

  <v-dialog v-model="listEventGeneratorDialog" max-width="600px">
    <v-card
      title="Generate Event"
      subtitle="Easily generate list events here without touching JSON"
    >
      <v-card-text>
        <v-form ref="eventGeneratorForm" v-model="eventGenerator.inputsValid"
                @submit.prevent="sendGeneratedEvent"
        >
          <v-autocomplete
            v-model="eventGenerator.event"
            variant="underlined"
            density="compact"
            label="event (Event Type)"
            :items="Object.values(EventType)"
            :rules="[rules.requiredField]"
            @update:model-value="updateDisplayingStateFields"
          />

          <v-autocomplete
            v-model="eventGenerator.listIdFormatted"
            variant="underlined"
            density="compact"
            label="listId"
            :items="library.map(l => `${l.list.listid} (${l.list.name})`)"
            :rules="[rules.requiredField]"
            @update:model-value="changeListIdListener"
          />

          <v-autocomplete
            v-if="eventGenerator.activeFields.includes('entryId')"
            v-model="eventGenerator.entryIdFormatted"
            variant="underlined"
            density="compact"
            label="entryId"
            :items="eventGenerator.globalEntries.map(e => `${e.id} (${e.name})`)"
            :rules="[rules.requiredField]"
          />

          <v-text-field
            v-if="eventGenerator.activeFields.includes('state.name')"
            v-model="eventGenerator.state.name"
            :rules="[rules.requiredField]"
            label="state.name"
            variant="underlined"
            density="compact"
          />
          <v-text-field
            v-if="eventGenerator.activeFields.includes('state.oldIndex')"
            v-model="eventGenerator.state.oldIndex"
            :rules="[rules.requiredField, rules.hasToBeNum]"
            label="state.oldIndex"
            variant="underlined"
            density="compact"
            type="number"
          />
          <v-text-field
            v-if="eventGenerator.activeFields.includes('state.newIndex')"
            v-model="eventGenerator.state.newIndex"
            :rules="[rules.requiredField, rules.hasToBeNum]"
            label="state.newIndex"
            variant="underlined"
            density="compact"
            type="number"
          />

          <v-btn type="submit" variant="tonal" block color="primary" class="mb-2 mt-1">
            Send
          </v-btn>
        </v-form>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import {
  VAutocomplete,
  VBtn,
  VCard,
  VCardText,
  VCombobox,
  VDialog,
  VForm,
  VTextField
} from 'vuetify/components';
import { computed, onMounted, Ref, ref } from 'vue';
import feathersClient, { Methods, Service } from '@/feathers-client';
import { useToast } from 'vue-toastification';
import JsonEditorVue from 'json-editor-vue';
import { useTheme } from 'vuetify';
import 'vanilla-jsoneditor/themes/jse-theme-dark.css';
import { JSONEditor } from 'vanilla-jsoneditor';
import { LibraryEntry } from '@/views/me/list/MyLists.vue';
import { EventData, EventType, LogEvent } from '@/shoppinglist/events';
import ShoppingList, { ShoppingListItem } from '@/shoppinglist/ShoppingList';
import { DotNestedKeys, ReverseMap } from '@/helpers/TypeUtils';
import { v4 as uuidv4 } from 'uuid';
import { useLoginStore } from '@/stores/login.store';

const toast = useToast();
const theme = useTheme();
const loginStore = useLoginStore();

type Rule = ((value: string) => boolean | string);

interface Rules {
  hasToBeNum: Rule,
  requiredField: Rule,
  requiredId: Rule,
}

interface EventGenerator {
  inputsValid: boolean | null,
  listIdFormatted: string | null,
  entryIdFormatted: string | null,
  event: ReverseMap<typeof EventType> | null,
  state: {
    name: string | null,
    oldIndex: string | null,
    newIndex: string | null,
  },
  globalEntries: ShoppingListItem[],
  eventTypeInputMap: StateInputMap,
  activeFields: FlattenedEventData[],
}

type FlattenedEventData = DotNestedKeys<EventData>;
type StateInputMap = {
  [key in ReverseMap<typeof EventType>]: FlattenedEventData[]
}

const services = ref(Object.values(Service));
const methods = ref([
  'create',
  'find',
  'get',
  'update',
  'patch',
  'remove',
]);
const methodArgsMap = ref({
  'create': ['data', 'params'],
  'find': ['params'],
  'get': ['id', 'params'],
  'update': ['id', 'data', 'params'],
  'patch': ['id', 'data', 'params'],
  'remove': ['id', 'params'],
});

const rules: Ref<Rules> = ref({
  hasToBeNum: value => !Number.isNaN(value) ? true : 'Value has to be a number!',
  requiredField: value => value ? true : 'This is a required field!',
  requiredId: value => value ? true : `${selectedMethod.value} requests have to have an id!`,
});

const isValid: Ref<boolean | null> = ref(true);
const form: Ref<VForm | null> = ref(null);

const selectedService = ref('');
const selectedMethod: Ref<Methods> = ref('find');

const reqId: Ref<number> = ref(-1);
const reqData: Ref<Record<string, unknown> | string> = ref({});
const reqParams: Ref<Record<string, unknown> | string> = ref({});

const response: Ref<unknown> = ref('Waiting for response');
const showResponseDialog = ref(false);

const responseEditor: Ref<JSONEditor | null> = ref(null);
const responseEditorFullscreen: Ref<JSONEditor | null> = ref(null);

const jseThemeCSS = computed(() => ({
  '--jse-theme-color': theme.current.value.colors.primary,
  '--jse-theme-color-highlight': theme.current.value.colors.secondary,
  '--jse-button-primary-background': theme.current.value.colors.primary
}));
const getJseTheme = computed(() => ({
  'jse-theme-dark': theme.current.value.dark
}));

// Event Generator
const listEventGeneratorDialog = ref(false);
const library: Ref<LibraryEntry[]> = ref([]);
const eventGeneratorForm: Ref<VForm | null> = ref(null);
const eventGenerator = ref({
  inputsValid: false,
  listIdFormatted: null,
  entryIdFormatted: null,
  event: null,
  state: {
    name: null,
    oldIndex: null,
    newIndex: null,
  },
  globalEntries: [],
  eventTypeInputMap: {
    MOVE_ENTRY: ['state.oldIndex', 'state.newIndex', 'entryId'],
    DELETE_ENTRY: ['entryId'],
    CREATE_ENTRY: ['state.name'],
    CHANGED_ENTRY_NAME: ['state.name', 'entryId'],
    MARK_ENTRY_DONE: ['entryId'],
    MARK_ENTRY_TODO: ['entryId'],
    CLEAR_DONE: [],
  },
  activeFields: [],
} as EventGenerator);

onMounted(() => {
  (window as unknown as Record<string, unknown>).feathersClient = feathersClient;
  console.warn('Exposed feathersClient at window.feathersClient!');
});

window.addEventListener('keydown', (e) => {
  const isJsonInput = document.activeElement?.classList.contains('svelte-1wlxti1') || document.activeElement?.attributes.getNamedItem('role')?.nodeValue === 'textbox';
  const isInput = document.activeElement?.nodeName.toLowerCase() === 'input';
  if (isInput || isJsonInput) return false;

  if (e.key === 'f') showResponseDialog.value = !showResponseDialog.value;
});

async function send() {
  // Fixes vuetify bug where on first validation, v-model (isValid) would be null instead of true/false, so we have to revalidate
  if (isValid.value === null) isValid.value = (await form.value?.validate())?.valid || false;
  if (!isValid.value) return;
  const service = feathersClient.service(selectedService.value as Service);

  const parsedId = reqId.value > 0 ? reqId.value : null;
  console.log(parsedId);

  if (typeof reqData.value === 'string') reqData.value = JSON.parse(reqData.value);
  if (typeof reqParams.value === 'string') reqParams.value = JSON.parse(reqParams.value);
  const data = reqData.value as Record<string, unknown>;
  const params = reqParams.value as Record<string, unknown>;

  let promise: Promise<unknown> | null = null;
  switch (selectedMethod.value) {
    case 'create':
      if (!data) return toast.error('Cannot create without data!');
      promise = service.create(data, params);
      break;

    case 'find':
      if (!params) return toast.error('No Params passed! Required!');
      promise = service.find(params);
      break;

    case 'remove':
    case 'get':
      if (!parsedId) return toast.error(`Cannot call ${selectedMethod.value} without id!`);
      promise = service[selectedMethod.value](parsedId, params);
      break;

    case 'update':
    case 'patch':
      promise = service[selectedMethod.value](parsedId, data, params);
      break;

    default:
      console.log('should not be possible!');
      break;
  }

  if (!promise) return;
  await executeAndLogRequest(promise);
}

async function executeAndLogRequest(promise: Promise<unknown>) {
  const logResponse = (data: unknown, logMethod: 'log' | 'error' | 'warn' | 'table' = 'log') => {
    console[logMethod](`${selectedService.value}.${selectedMethod.value}${reqId.value !== -1 ? '{' + reqId.value + '}' : ''}: `, data);
  };

  await promise.then((d) => {
    logResponse(d);
    response.value = d;
  }).catch((e) => {
    toast.warning('Backend responded with an error! Check Response');
    response.value = JSON.parse(JSON.stringify(e)); // or jse won't recognize properties and wont load tree/table view
    logResponse(JSON.stringify(e, null, 2));
    logResponse(e, 'error');
  });

  responseEditor.value?.jsonEditor.expand();
  responseEditorFullscreen.value?.jsonEditor.expand();
}

// Event Generator
async function openGenerateEventDialog() {
  library.value = await feathersClient.service(Service.LIBRARY).find();
  listEventGeneratorDialog.value = true;
}

function extractUUID(s: string) {
  return s.split(' ')[0];
}

function updateGlobalEntries(): ShoppingListItem[] {
  if (!library.value || !eventGenerator.value.listIdFormatted) return [];
  const list = library.value.find(l => l.list.listid === extractUUID(eventGenerator.value.listIdFormatted ?? '')).list;
  return ShoppingList.from(list).globalEntries;
}

function changeListIdListener() {
  eventGenerator.value.globalEntries = updateGlobalEntries();
}

function updateDisplayingStateFields() {
  if (!eventGenerator.value.event) return;
  const stateFields = (['state.name', 'state.oldIndex', 'state.newIndex', 'entryId'] as FlattenedEventData[]);
  eventGenerator.value.activeFields = stateFields.filter(f => eventGenerator.value.eventTypeInputMap[eventGenerator.value.event ?? EventType.CREATE_ENTRY].includes(f));
}

async function sendGeneratedEvent() {
  const event = eventGenerator.value;

  // Fixes vuetify bug where on first validation, v-model (isValid) would be null instead of true/false, so we have to revalidate
  if (event.inputsValid === null) eventGenerator.value.inputsValid = (await eventGeneratorForm.value?.validate())?.valid || false;
  if (!event.inputsValid) return;

  const data: LogEvent = {
    listid: '',
    eventData: {
      event: EventType.CREATE_ENTRY,
      entryId: '', // FIXME: Remove this for create entry once backend generates 'em
      state: {
        name: 'ERROR from Busket Backend Tester in sendGeneratedEvent.data (const not reassign)',
      },

      // FIXME: Remove once server handles this
      isoDate: new Date().toISOString(),
      sender: loginStore.user?.uuid,
    }
  };

  if (!event.listIdFormatted || !event.event) return;
  data.listid = extractUUID(event.listIdFormatted);
  data.eventData.event = event.event;

  if (event.entryIdFormatted) {
    data.eventData.entryId = extractUUID(event.entryIdFormatted);
  } else if (event.event === EventType.CREATE_ENTRY) data.eventData.entryId = uuidv4();

  if (event.activeFields.includes('state.name')) data.eventData.state.name = event.state.name ?? 'ERROR from Busket Backend Tester';
  if (event.activeFields.includes('state.newIndex')) data.eventData.state.newIndex = parseInt(event.state.newIndex ?? '-1');
  if (event.activeFields.includes('state.oldIndex')) data.eventData.state.oldIndex = parseInt(event.state.oldIndex ?? '-1');

  toast.success('Sent event!');
  listEventGeneratorDialog.value = false;

  selectedService.value = Service.EVENT;
  selectedMethod.value = 'create';
  reqData.value = data as unknown as Record<string, unknown>;

  await executeAndLogRequest(feathersClient.service(Service.EVENT).create([data]));
}
</script>

<style lang="scss">
.jse-border-rounded > .jse-main > div > .jse-menu {
  border-top-left-radius: 5px;
  border-top-right-radius: 5px;
}

button.jse-button:nth-child(1) {
  border-top-left-radius: 5px;
  border-bottom-left-radius: 5px;
}

.jse-menu {
  > button:nth-child(1) {
    border-top-left-radius: 5px !important;
    border-bottom-left-radius: 5px !important;
  }

  > button:nth-child(3) {
    border-top-right-radius: 5px !important;
    border-bottom-right-radius: 5px !important;
  }
}
</style>
