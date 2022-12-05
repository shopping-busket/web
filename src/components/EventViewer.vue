<template>
  <v-dialog v-model="model" max-width="850px" class="pa-2">
    <v-card title="{{ listName }} Log" subtitle="View the log of this list.">
      <v-card-text>
        <div class="mb-1 d-flex flex-row">
          <v-checkbox v-model="showISO" label="Show ISO string" />
          <v-checkbox v-model="showIndexNumber" label="Index" class="ml-5" />
          <v-checkbox v-model="showIcons" label="Icons" class="ml-5" />
          <v-checkbox v-model="colorCode" label="Color" class="ml-5" />
          <v-checkbox v-model="wrapContent" label="Wrap" class="ml-5" />
          <v-checkbox v-model="hideId" label="Hide id" class="ml-5" />
          <v-checkbox v-model="logToConsole" label="Console log" class="ml-5" />
        </div>

        <v-sheet
          v-if="events" outlined
          :class="{ 'scroll': true, 'text-no-wrap': !wrapContent, 'px-1': true }"
        >
          <div
            v-if="events.length <= 0"
            class="d-flex justify-center align-center fill-height gray"
          >
            No log available. Try reloading or changing something.
          </div>
          <div v-for="(event, i) in events.slice().reverse()" :key="i">
            <span v-if="showIndexNumber" class="gray mr-1">[{{ events.length - i }}]</span>
            <v-icon
              v-if="showIcons"
              small
              class="mr-1"
              :color="colorCode ? map[event.event].color : ''"
            >
              {{ map[event.event].icon }}
            </v-icon>
            <span :style="{ color: colorCode ? map[event.event].color : 'inherit' }" class="mr-1">
              {{ event.event }}
            </span>
            <span :class="colorCode ? 'state mr-1' : 'mr-1'">
              <ColorJson :is="ColorJson" v-if="colorCode" :input="JSON.stringify(event.state)" />
              <span v-else>{{ JSON.stringify(event.state) }}</span>
            </span>
            <span v-if="!hideId" :class="colorCode ? 'itemId mr-1' : 'mr-1'">{{
              event.entryId
            }}</span>
            <span :class="colorCode ? 'at mr-1' : 'mr-1'">at</span>
            <span :class="{ 'date': colorCode }">
              {{ showISO ? event.isoDate : '' }}
              ({{ formatDate(event.isoDate) }})
            </span>
            <v-divider />
          </div>
        </v-sheet>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import {
  VDialog,
  VCard,
  VCardText,
  VDivider,
  VSheet,
  VIcon,
  VCheckbox,
} from 'vuetify/components';
import { LogEvent } from '@/shoppinglist/events';
import ColorJson from '@/components/ColorJson.vue';
import { computed, ref } from 'vue';

const props = defineProps<{
  modelValue: boolean,
  listName: string,
  events: LogEvent[],
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

const logToConsole = ref(false);
const showISO = ref(false);
const showIndexNumber = ref(true);
const showIcons = ref(true);
const colorCode = ref(true);
const wrapContent = ref(false);
const hideId = ref(false);
const map = {
  /* 1 */
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
  /* 6 */
  MARK_ENTRY_TODO: {
    icon: 'mdi-clock-outline',
    color: '#c96e00'
  },
};

function formatDate(iso: string): string {
  const fmt = (num: number) => num < 10 ? `0${num}` : num.toString();
  const d = new Date(iso);
  return `${fmt(d.getMonth())}/${fmt(d.getDay())}/${d.getFullYear()} ${fmt(d.getHours())}:${fmt(d.getMinutes())}:${fmt(d.getSeconds())}`;
}
</script>


<style scoped lang="scss">
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
</style>
