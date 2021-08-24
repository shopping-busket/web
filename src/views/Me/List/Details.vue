<template>
  <div style="max-width: 800px; margin: auto" class="mt-4">
    <v-card outlined>
      <v-card-title>Shopping list
        <v-btn icon small color="primary" @click="$router.push(`/me/list/${id}/logs`)">
          <v-icon small>mdi-text-box</v-icon>
        </v-btn>
      </v-card-title>
      <v-card-subtitle>No description yet.</v-card-subtitle>
      <v-card-text class="mb-0 pb-0">
        <v-text-field placeholder="Add item"
                      outlined
                      append-icon="mdi-basket-plus-outline"
                      @click:append="addListEntry()"
                      dense
                      ref="addItemField"
                      v-model="newItemName"
                      :rules="newEntryRules"
                      @blur="newItemName.length === 0 ? $refs.addItemField.resetValidation() : null"
        ></v-text-field>
        <!--    TODO: Actually make this work good    -->
        <!--        <v-autocomplete :items="suggestedItems"-->
        <!--                        outlined-->
        <!--                        placeholder="Add item"-->
        <!--                        :search-input.sync="suggestionSearch"-->
        <!--                        :loading="suggestionLoading"-->
        <!--                        hide-no-data-->
        <!--                        hide-selected-->
        <!--                        append-icon="mdi-basket-plus-outline"-->
        <!--                        @click:append="addListEntry()"-->
        <!--                        dense-->
        <!--        /> -->
      </v-card-text>
    </v-card>

    <v-sheet outlined rounded class="mt-3 pa-2">
      <div class="hr-sect mb-1">Todo {{ getCount(false) }}</div>
      <vuedraggable v-model="items" :animation="0" handle=".handle" ghost-class="ghost">
        <transition-group type="transition" name="flip-list">
          <div v-for="item in items.filter((t) => !t.done)" :key="item.id">
            <v-sheet outlined rounded class="d-flex flex-row align-center pa-2 mt-2">
              <v-checkbox dense class="ma-0 pa-0" style="height: 24px" :input-value="item.done"
                          @click="checkItem(item.id, true)"></v-checkbox>
              <v-text-field outlined dense color="primary" label="Name" v-model="item.additional.editName"
                            v-if="item.additional.edit" hide-details></v-text-field>
              <div v-else>{{ item.name }}</div>
              <v-btn icon small @click="item.additional.edit = !item.additional.edit"
                     v-if="item.additional.editName === item.name">
                <v-icon small>{{
                    item.additional.edit ? 'mdi-pencil-outline' : 'mdi-pencil'
                  }}
                </v-icon>
              </v-btn>
              <div v-else>
                <v-btn icon
                       small
                       @click="renameEntry(item.additional.editName, item.id)"
                >
                  <v-icon small>
                    mdi-content-save
                  </v-icon>
                </v-btn>
                <v-btn icon
                       small
                       @click="item.additional.edit = false; item.additional.editName = item.name;"
                >
                  <v-icon small>
                    mdi-close
                  </v-icon>
                </v-btn>
              </div>
              <v-spacer></v-spacer>
              <v-icon small class="handle">mdi-menu</v-icon>
            </v-sheet>
          </div>
        </transition-group>
      </vuedraggable>

      <div class="hr-sect mb-1 mt-4">
        <v-btn outlined color="red" x-small @click="clearDone" class="mr-2">
          <v-icon small>mdi-trash-can-outline</v-icon>
        </v-btn>
        Done {{ getCount(true) }}
      </div>
      <vuedraggable v-model="items" :animation="0" handle=".handle" ghost-class="ghost">
        <transition-group type="transition" name="flip-list">
          <div v-for="item in items.filter((t) => t.done)" :key="item.id">
            <v-sheet outlined rounded
                     class="d-flex flex-row align-center pa-2 mt-2">
              <v-checkbox dense class="ma-0 pa-0" style="height: 24px" :input-value="item.done"
                          @click="checkItem(item.id, false)"></v-checkbox>
              <div class="done">
                <v-text-field outlined dense color="primary" label="Name" v-model="item.name"
                              v-if="item.additional.edit" hide-details></v-text-field>
                <div v-else>{{ item.name }}</div>
              </div>
              <v-btn icon small @click="item.additional.edit = !item.additional.edit">
                <v-icon small>{{
                    item.additional.edit ? 'mdi-pencil-outline' : 'mdi-pencil'
                  }}
                </v-icon>
              </v-btn>
              <v-spacer></v-spacer>
              <v-icon small class="handle">mdi-menu</v-icon>
            </v-sheet>
          </div>
        </transition-group>
      </vuedraggable>
    </v-sheet>

    <ListLogs></ListLogs>
  </div>
</template>

<script lang="ts">
import {
  Component,
  Prop,
  Vue,
  Watch,
} from 'vue-property-decorator';
import { v4 as uuidv4 } from 'uuid';
import vuedraggable from 'vuedraggable';
import ListLogs from '@/components/ListLogs.vue';
import feathersClient, { User } from '@/feathers-client';

interface ListItem {
  name: string,
  done: boolean,
  id: string,
  additional: {
    edit: boolean,
    editName: string,
  },
}

enum LogAction {
  /* 1 */ MOVE_ENTRY = 1,
  /* 2 */ DELETE_ENTRY,
  /* 3 */ CREATE_ENTRY,
  /* 4 */ CHANGED_ENTRY_NAME,
  /* 5 */ MARK_ENTRY_DONE,
  /* 6 */ MARK_ENTRY_TODO,
}

@Component({
  components: {
    ListLogs,
    vuedraggable,
  },
})
export default class Details extends Vue {
  @Prop() private id: string | undefined;
  private suggestedItems: string[] = [];
  private suggestionSearch = '';
  private suggestionLoading = false;
  private items: ListItem[] = [
    {
      name: 'HAAAAAAAAAAAAAAAAAAAAM',
      done: false,
      id: uuidv4(),
      additional: { edit: false, editName: 'HAAAAAAAAAAAAAAAAAAAAM' },
    },
    {
      name: 'List item 2',
      done: true,
      id: uuidv4(),
      additional: { edit: false, editName: 'List item 2' },
    },
  ];
  private newItemName = '';
  private newEntryRules = [
    (val: string) => /^([A-z])\w*$/.test(val) || 'Allowed characters: A-z, spaces',
  ];
  private user: null | User = null;

  async mounted (): Promise<void> {
    this.user = await feathersClient.get('authentication').user;
    console.log('List id:', this.id);
  }

  // TODO: Make actual API call
  @Watch('suggestionSearch')
  suggestionAPICall (val: string): void {
    this.suggestionLoading = true;
    setTimeout(() => {
      const names = [
        'ham',
        'lind pistazien schoko',
        'schinke',
        'milch',
        'wasser',
        'makava',
      ];
      const out = names.find((n) => n.includes(val));
      console.log(out, val);
      if (!out) return;
      this.suggestedItems.push(out);
      this.suggestionLoading = false;
    }, Math.random() * 10);
  }

  getCount (done: boolean): string {
    const count = this.items.filter((t) => t.done === done).length;

    if (count === 0) return '';
    return ` ― ${count}`;
  }

  checkItem (id: string, check: boolean): void {
    const item = this.items.find((t) => t.id === id);
    if (!item) {
      this.$toast.error('Something went horribly wrong...');
      return;
    }
    item.done = check;
    this.pushLog(check ? LogAction.MARK_ENTRY_DONE : LogAction.MARK_ENTRY_TODO, id);
  }

  addListEntry (): void {
    const itemName = this.newItemName;
    console.log(this.newItemName);
    itemName.trim();

    const id = uuidv4();
    this.items.push({
      name: itemName,
      done: false,
      id,
      additional: {
        edit: false,
        editName: itemName,
      },
    });
    this.newItemName = '';

    this.pushLog(LogAction.CREATE_ENTRY, id);
  }

  renameEntry (name: string, id: string): void {
    const item = this.items.find((t) => t.id === id);
    if (!item) return;

    item.additional.edit = false;
    item.name = name;
    this.pushLog(LogAction.CHANGED_ENTRY_NAME, item.id);
  }

  clearDone (): void {
    // TODO: Clear done items
    const del = this.items.filter((t) => t.done);
    this.items = this.items.filter((t) => !t.done);

    del.forEach((t) => {
      this.pushLog(LogAction.DELETE_ENTRY, t.id);
    });
  }

  pushLog (action: LogAction, itemId: string): void {
    // TODO: Change log format to something more reasonable
    const logActions = [
      /* 1 */ 'MOVE_ENTRY',
      /* 2 */ 'DELETE_ENTRY',
      /* 3 */ 'CREATE_ENTRY',
      /* 4 */ 'CHANGE_ENTRY_NAME',
      /* 5 */ 'MARK_ENTRY_DONE',
      /* 6 */ 'MARK_ENTRY_TODO',
    ];

    let storage = localStorage.getItem('logs');
    if (!storage) {
      localStorage.setItem('logs', '');
      storage = '';
    }

    const eventString = `${logActions[action - 1]} -> ${itemId} ${Date.now()}`;
    localStorage.setItem('logs', `${storage === '' ? '' : `${storage},`}${eventString}`);

    console.log(`%c[Logs]%c${eventString}`, 'color: cyan');
  }
}
</script>

<style lang="scss" scoped>
.hr-sect {
  display: flex;
  flex-basis: 100%;
  align-items: center;
  color: rgba(0, 0, 0, 0.35);
  margin-left: 5px;
  font-variant: all-small-caps;

  &:after {
    content: "";
    flex-grow: 1;
    background: rgba(0, 0, 0, 0.35);
    height: 1px;
    font-size: 0;
    line-height: 0;
    margin: 0 8px;
  }
}

.ghost {
  opacity: 0.5;
  background: #c8ebfb;
}

.done {
  color: #444;
  text-decoration: line-through;
}

//.done {
//  text-decoration: none;
//  color: #444;
//  display: inline-block;
//  position: relative;
//  transition: all 0.5s cubic-bezier(.55, 0, .1, 1);
//
//  &:after {
//    content: '';
//    position: absolute;
//    display: block;
//    width: 100%;
//    height: 2px;
//    margin-top: -0.7em;
//    background: black;
//    transform-origin: left;
//    animation: strikethrough .6s cubic-bezier(.55, 0, .1, 1);
//    transition: transform 0.5s cubic-bezier(.55, 0, .1, 1);
//  }
//}

/* Keyframes for initial animation */

//@keyframes strikethrough {
//  from {
//    transform: scaleX(0);
//  }
//  to {
//    transform: scaleX(1);
//  }
//}
</style>
