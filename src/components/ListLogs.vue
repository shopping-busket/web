<template>
  <v-dialog max-width="850px" class="pa-2" v-model="openDialog">
    <v-card>
      <v-card-title>{{ listName }} Log</v-card-title>
      <v-card-subtitle>View the log of this list.</v-card-subtitle>
      <v-card-text>
        <v-btn color="primary" block outlined small @click="reloadLog">
          <v-icon>mdi-reload</v-icon>
          Reload
        </v-btn>
        <div class="mb-1 d-flex flex-row">
          <v-checkbox label="Show ISO string" v-model="showISO"></v-checkbox>
          <v-checkbox label="Index" v-model="showIndexNumber" class="ml-5"></v-checkbox>
          <v-checkbox label="Icons" v-model="showIcons" class="ml-5"></v-checkbox>
          <v-checkbox label="Color" v-model="colorCode" class="ml-5"></v-checkbox>
          <v-checkbox label="Wrap" v-model="wrapContent" class="ml-5"></v-checkbox>
          <v-checkbox label="Notification" v-model="logNotification" class="ml-5"></v-checkbox>
          <v-checkbox label="Console log" v-model="logToConsole" class="ml-5"></v-checkbox>
        </div>

        <v-sheet outlined :class="{ 'scroll': true, 'text-no-wrap': !wrapContent, 'px-1': true }">
          <div v-if="log.length <= 0" class="d-flex justify-center align-center fill-height gray">No log available. Try reloading or changing something.</div>
          <div v-for="(item, i) in log.slice().reverse()" :key="i">
            <span class="gray mr-1" v-if="showIndexNumber">[{{ log.length - i }}]</span>
            <v-icon v-if="showIcons"
                    small
                    class="mr-1"
                    :color="colorCode ? map[item.action].color : ''"
            >
              {{ map[item.action].icon }}
            </v-icon>
            <span :style="{ color: colorCode ? map[item.action].color : 'inherit' }" class="mr-1">
              {{ item.action }}
            </span>
            <span :class="colorCode ? 'arrow mr-1' : 'mr-1'">=></span>
            <span :class="colorCode ? 'itemId mr-1' : 'mr-1'">{{ item.itemId }}</span>
            <span :class="colorCode ? 'at mr-1' : 'mr-1'">at</span>
            <span :class="{ 'date': colorCode }">
              {{ showISO ? item.isoDate : '' }}
            ({{ formatDate(item.isoDate) }})
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
  Prop,
  VModel,
  Vue,
  Watch,
} from 'vue-property-decorator';

export enum LogAction {
  /* 1 */ MOVE_ENTRY = 1,
  /* 2 */ DELETE_ENTRY,
  /* 3 */ CREATE_ENTRY,
  /* 4 */ CHANGED_ENTRY_NAME,
  /* 5 */ MARK_ENTRY_DONE,
  /* 6 */ MARK_ENTRY_TODO,
}

export interface LogItem {
  action: LogAction | string,
  itemId: string,
  isoDate: string,
}

@Component
export default class ListLogs extends Vue {
  @VModel({ type: Boolean }) readonly openDialog!: boolean;
  @Prop({ required: true }) private listName: string | undefined;
  private logString = '';
  // noinspection JSMismatchedCollectionQueryUpdate
  private log: LogItem[] = [];
  private showISO = false;
  private showIndexNumber = true;
  private showIcons = true;
  private colorCode = true;
  private wrapContent = false;
  private logNotification = false;
  private logToConsole = false;
  private map = {
    /* 1 */ MOVE_ENTRY: { icon: 'mdi-cursor-move', color: '#B8860B' },
    /* 2 */ DELETE_ENTRY: { icon: 'mdi-trash-can-outline', color: '#FF0000' },
    /* 3 */ CREATE_ENTRY: { icon: 'mdi-playlist-plus', color: '#008080' },
    /* 4 */ CHANGE_ENTRY_NAME: { icon: 'mdi-pencil-outline', color: '#C71585' },
    /* 5 */ MARK_ENTRY_DONE: { icon: 'mdi-checkbox-marked-outline', color: '#2E8B57' },
    /* 6 */ MARK_ENTRY_TODO: { icon: 'mdi-clock-outline', color: '#c96e00' },
  };

  mounted (): void {
    this.logString = this.populateLogString();
    this.convertLogString();
  }

  private reloadLog (): void {
    this.log = [];
    this.logString = '';

    this.logString = this.populateLogString();
    this.convertLogString();
  }

  @Watch('logString')
  private convertLogString (): void {
    if (!this.logString) return;
    this.log = this.logString.split(',').map((t): LogItem => {
      const str = t.split(' ');
      return {
        action: str[0],
        itemId: str[2],
        isoDate: str[3],
      };
    });
  }

  public populateLogString (): string {
    let storage = localStorage.getItem('logs');
    if (!storage) {
      localStorage.setItem('logs', '');
      storage = '';
    }
    return storage;
  }

  public pushLog (action: LogAction, itemId: string): void {
    const logActions = [
      /* 1 */ 'MOVE_ENTRY',
      /* 2 */ 'DELETE_ENTRY',
      /* 3 */ 'CREATE_ENTRY',
      /* 4 */ 'CHANGE_ENTRY_NAME',
      /* 5 */ 'MARK_ENTRY_DONE',
      /* 6 */ 'MARK_ENTRY_TODO',
    ];

    const storage = this.populateLogString();

    const eventString = `${logActions[action - 1]} -> ${itemId} ${new Date().toISOString()}`;
    localStorage.setItem('logs', `${storage === '' ? '' : `${storage},`}${eventString}`);
    this.logString = `${storage === '' ? '' : `${storage},`}${eventString}`;

    if (this.logToConsole) console.log(`%c[Logs]%c${eventString}`, 'color: cyan');
    if (this.logNotification) this.$toast(`[Logs] ${eventString.substr(0, eventString.lastIndexOf(' '))} (${this.formatDate(eventString.split(' ')[3])})`);
  }

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

//noinspection CssUnusedSymbol
.itemId, .date {
  color: #625b83;
}
</style>
