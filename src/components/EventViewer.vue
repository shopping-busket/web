<template>
  <v-dialog v-model="model" class="pa-2" max-width="850px">
    <v-card :title="`Log of list '${listName}'`" subtitle="View the log of this list.">
      <v-card-text>
        <div class="mb-8 d-flex flex-row flex-wrap checkbox-wrapper">
          <v-checkbox v-model="displayIndexNumber" class="" label="Index" />
          <v-checkbox v-model="displayIcons" class="ml-5" label="Icons" />
          <v-checkbox v-model="colorCode" class="ml-5" label="Color" />
          <v-checkbox v-model="logToConsole" class="ml-5" label="Console log" />
          <v-checkbox v-model="wrapContent" class="ml-5" style="width: 20rem" label="Wrap" />
          <v-checkbox v-model="displayISO" class="" label="Show ISO string" />
          <v-checkbox v-model="displayId" class="ml-5" label="Show ID" />
          <v-checkbox v-model="displayDate" class="ml-5" label="Show Date" />
          <v-checkbox v-model="displayJSON" class="ml-5" label="Show JSON" />
          <v-checkbox v-model="displaySender" class="ml-5" label="Show Sender" />
        </div>

        <v-sheet
          v-if="events" :class="{ 'scroll': true, 'text-no-wrap': !wrapContent, 'px-1': true }"
          outlined
        >
          <div
            v-if="events.length <= 0"
            class="d-flex justify-center align-center fill-height gray"
          >
            No log available. Try reloading or changing something.
          </div>
          <div v-for="(event, i) in events.slice().reverse() as EventData[]" :key="i">
            <span v-if="displayIndexNumber" class="gray mr-1">[{{ events.length - i }}]</span>
            <v-icon
              v-if="displayIcons"
              :color="colorCode ? map[event.event].color : ''"
              class="mr-1"
              small
            >
              {{ map[event.event].icon }}
            </v-icon>
            <span :style="{ color: colorCode ? map[event.event].color : 'inherit' }" class="mr-1">
              {{ event.event }}
            </span>
            <span v-if="displayJSON" :class="colorCode ? 'state mr-1' : 'mr-1'">
              <ColorJson :is="ColorJson" v-if="colorCode" :input="JSON.stringify(event.state)" />
              <span v-else>{{ JSON.stringify(event.state) }}</span>
            </span>
            <span v-if="displayId" :class="colorCode ? 'itemId mr-1' : 'mr-1'">{{ event.entryId }}</span>

            <span v-if="displayISO || displayDate" :class="colorCode ? 'at mr-1' : 'mr-1'">at</span>
            <span v-if="event.isoDate" :class="{ 'date': colorCode }">
              {{ displayISO ? event.isoDate : '' }}
              {{ displayDate ? `(${formatDate(event.isoDate)})` : '' }}
            </span>

            <span v-if="displaySender" :class="colorCode ? 'at mr-1' : 'mr-1'">by</span>
            <span v-if="displaySender" :class="{ 'sender': colorCode }">{{ event.sender ?? 'us (this client)' }}</span>

            <v-divider />
          </div>
        </v-sheet>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import { VCard, VCardText, VCheckbox, VDialog, VDivider, VIcon, VSheet, } from 'vuetify/components';
import { EventData, EventType } from '@/shoppinglist/events';
import ColorJson from '@/components/ColorJson.vue';
import { computed, ref } from 'vue';
import feathersClient from '@/feathers-client';

const props = defineProps<{
  modelValue: boolean,
  listName: string,
  events: EventData[],
}>();
const emit = defineEmits(['update:modelValue']);
const model = computed({
  get() {
    return props.modelValue;
  },

  set(value) {
    return emit('update:modelValue', value);
  }
});

type EventTypeMap = {
  [eventType in (EventType)]: { icon: string; color: string; };
};

const logToConsole = ref(false);
const displayISO = ref(false);
const displayIndexNumber = ref(true);
const displayIcons = ref(true);
const colorCode = ref(true);
const wrapContent = ref(false);
const displayId = ref(true);
const displayDate = ref(true);
const displayJSON = ref(true);
const displaySender = ref(true);
const map: EventTypeMap = {
  MOVE_ENTRY: {
    icon: 'mdi-cursor-move',
    color: '#B8860B'
  },
  /* 2 */
  DELETE_ENTRY: {
    icon: 'mdi-trash-can-outline',
    color: '#FF0000'
  },
  /* 3 */
  CREATE_ENTRY: {
    icon: 'mdi-playlist-plus',
    color: '#008080'
  },
  /* 4 */
  CHANGED_ENTRY_NAME: {
    icon: 'mdi-pencil-outline',
    color: '#C71585'
  },
  /* 5 */
  MARK_ENTRY_DONE: {
    icon: 'mdi-checkbox-marked-outline',
    color: '#2E8B57'
  },
  /* 5 */
  MARK_ENTRY_TODO: {
    icon: 'mdi-checkbox-blank-outline',
    color: '#2E8B57'
  },
  /* 6 */
  CLEAR_DONE: {
    icon: 'mdi-trash-can-outline',
    color: '#FF0000'
  },
};

function formatDate(iso: string): string {
  const fmt = (num: number) => num < 10 ? `0${num}` : num.toString();
  const d = new Date(iso);
  return `${fmt(d.getMonth())}/${fmt(d.getDay())}/${d.getFullYear()} ${fmt(d.getHours())}:${fmt(d.getMinutes())}:${fmt(d.getSeconds())}`;
}

async function getSenderNameById(id: string): Promise<void> {
  const data = await feathersClient.service('users').find({
    query: {
      uuid: id,
    },
  });

  console.log(data);
}
</script>


<style lang="scss" scoped>
.scroll {
  overflow-y: scroll;
  height: calc(100vh - 20rem);
}

.arrow, .at, .gray {
  color: #b4b4b4;
}

.state {
  background: #282c34;
  padding: 3px 4px;
  border-radius: 3px;
  color: #aab1be;
}

//noinspection CssUnusedSymbol
.date, .itemId {
  color: #625b83;
}

.checkbox-wrapper>div {
  height: 3.5rem;
  margin-bottom: -1.5rem;
}
</style>
