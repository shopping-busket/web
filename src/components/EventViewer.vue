<template>
  <v-dialog max-width="850px" class="pa-2" v-model="openDialog">
    <v-card>
      <v-card-title>{{ listName }} Log</v-card-title>
      <v-card-subtitle>Inspect the session events.</v-card-subtitle>
      <v-card-text>
        <div class="mb-1 d-flex flex-row">
          <v-checkbox label="Show ISO string" v-model="showISO"></v-checkbox>
          <v-checkbox label="Index" v-model="showIndexNumber" class="ml-5"></v-checkbox>
          <v-checkbox label="Icons" v-model="showIcons" class="ml-5"></v-checkbox>
          <v-checkbox label="Color" v-model="colorCode" class="ml-5"></v-checkbox>
          <v-checkbox label="Wrap" v-model="wrapContent" class="ml-5"></v-checkbox>
          <v-checkbox label="Hide id" v-model="hideId" class="ml-5"></v-checkbox>
          <v-checkbox label="Console log" v-model="logToConsole" class="ml-5"></v-checkbox>
        </div>

        <v-sheet outlined :class="{ 'scroll': true, 'text-no-wrap': !wrapContent, 'px-1': true }"
                 v-if="events">
          <div v-if="events.length <= 0"
               class="d-flex justify-center align-center fill-height gray">
            No log available. Try reloading or changing something.
          </div>
          <div v-for="(event, i) in events.slice().reverse()" :key="i">
            <span class="gray mr-1" v-if="showIndexNumber">[{{ events.length - i }}]</span>
            <v-icon v-if="showIcons"
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
              <ColorJson :input="JSON.stringify(event.state)" v-if="colorCode"/>
              <span v-else>{{ JSON.stringify(event.state) }}</span>
            </span>
            <span :class="colorCode ? 'itemId mr-1' : 'mr-1'" v-if="!hideId">{{
                event.entryId
              }}</span>
            <span :class="colorCode ? 'at mr-1' : 'mr-1'">at</span>
            <span :class="{ 'date': colorCode }">
              {{ showISO ? event.isoDate : '' }}
            ({{ formatDate(event.isoDate) }})
            </span>
            <v-divider></v-divider>
          </div>
        </v-sheet>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import {
  Component,
  Prop, PropSync,
  VModel,
  Vue,
} from 'vue-property-decorator';
import { LogEvent } from '@/views/Me/List/Details.vue';
import ColorJson from '@/components/ColorJson.vue';

@Component({
  components: {
    ColorJson,
  },
})
export default class EventViewer extends Vue {
  @VModel({ type: Boolean }) readonly openDialog!: boolean;
  @Prop({ required: true }) private listName: string | undefined;
  @Prop({ required: true }) private events: LogEvent[] | undefined;
  @PropSync('console-log', { type: Boolean }) logToConsole!: boolean;

  // noinspection JSMismatchedCollectionQueryUpdate
  private showISO = false;
  private showIndexNumber = true;
  private showIcons = true;
  private colorCode = true;
  private wrapContent = false;
  private hideId = false;
  private map = {
    /* 1 */ MOVE_ENTRY: { icon: 'mdi-cursor-move', color: '#B8860B' },
    /* 2 */ DELETE_ENTRY: { icon: 'mdi-trash-can-outline', color: '#FF0000' },
    /* 3 */ CREATE_ENTRY: { icon: 'mdi-playlist-plus', color: '#008080' },
    /* 4 */ CHANGED_ENTRY_NAME: { icon: 'mdi-pencil-outline', color: '#C71585' },
    /* 5 */ MARK_ENTRY_DONE: { icon: 'mdi-checkbox-marked-outline', color: '#2E8B57' },
    /* 6 */ MARK_ENTRY_TODO: { icon: 'mdi-clock-outline', color: '#c96e00' },
  };

  // noinspection JSMethodCanBeStatic
  private formatDate (iso: string): string {
    function fmt (num: number): string {
      return num < 10 ? `0${num}` : num.toString();
    }

    const d = new Date(iso);
    return `${fmt(d.getMonth())}/${fmt(d.getDay())}/${d.getFullYear()} ${fmt(d.getHours())}:${fmt(d.getMinutes())}:${fmt(d.getSeconds())}`;
  }
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
