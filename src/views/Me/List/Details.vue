<template>
  <div style="max-width: 800px; margin: auto" class="mt-4">
    <v-card outlined>
      <v-card-title>
        <div v-if="shoppingList !== null">
          {{ shoppingList.name }}
        </div>
        <div v-else>Working on it...</div>

        <v-btn icon small color="primary" @click="openLogDialog = true">
          <v-icon small>mdi-text-box</v-icon>
        </v-btn>
      </v-card-title>
      <v-card-subtitle>
        <div v-if="shoppingList !== null">
          {{ shoppingList.description }}
        </div>
        <div v-else>Working on it...</div>
      </v-card-subtitle>

      <v-card-text class="mb-0 pb-0">
        <v-text-field placeholder="Add item"
                      outlined
                      append-icon="mdi-basket-plus-outline"
                      @click:append="createItem"
                      @keydown.enter="createItem"
                      dense
                      ref="newItemField"
                      v-model="newItemName"
                      :rules="newItemRules"
                      @blur="newItemName.length === 0 ? $refs.newItemField.resetValidation() : null"
        />
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
      <div v-if="shoppingList === null"
           class="d-flex justify-center align-items">
        Loading
        <v-progress-circular color="primary" :size="25" :width="3" indeterminate class="ml-2"></v-progress-circular>
      </div>
      <div v-else>
        <TodoList
          label="Todo"
          :shopping-list="shoppingList"
          is-todo-list
          @rename="renameItem"
          class="mb-4"
        />

        <TodoList
          label="Done"
          :shopping-list="shoppingList"
          @rename="renameItem"
        />
      </div>
    </v-sheet>

    <!-- TODO: Change list name   -->
    <ListLogs
      v-if="shoppingList !== null"
      :log-string="logString"
      :list-name="shoppingList.name"
      v-model="openLogDialog"
      ref="log"/>
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
import ListLogs, { LogAction } from '@/components/ListLogs.vue';
import TodoList from '@/components/TodoList.vue';
import feathersClient, { User } from '@/feathers-client';
import ShoppingList from '@/ShoppingList';

@Component({
  components: {
    ListLogs,
    TodoList,
    vuedraggable,
  },
})
export default class Details extends Vue {
  @Prop() private id: string | undefined;
  protected suggestedItems: string[] = [];
  private suggestionSearch = '';
  private suggestionLoading = false;
  private logString = '';
  private openLogDialog = false;
  private shoppingList: ShoppingList | null = null;
  private newItemName = '';
  private newItemRules = [
    (val: string) => /^ *\w+ *$/.test(val) || 'Allowed characters: A-z, spaces',
  ];
  private user: null | User = null;

  async mounted (): Promise<void> {
    // TODO: Get list from API
    const items = [
      {
        name: 'Ham',
        id: uuidv4(),
        done: false,
      },
    ];
    this.shoppingList = new ShoppingList('My shopping list', 'My groceries feel save here', items);
    console.log(this.shoppingList);

    this.user = await feathersClient.get('authentication').user;
    console.log('List id:', this.id);
  }

  // Item function wrappers
  renameItem (id: string): void {
    if (!this.shoppingList) return;

    const item = this.shoppingList.items.find((t) => t.id === id);
    if (!item) return;

    this.shoppingList.renameItem(item.id, item.additional.editName);
    item.additional.edit = false;

    // TODO: Push event
  }

  createItem (): void {
    const name = this.newItemName;

    for (let i = 0; i < this.newItemRules.length; i++) {
      const rule = this.newItemRules[i];
      if (typeof rule(name) === 'string') {
        this.$toast('Name needs at least 1 character; Can include A-z, space');
        return;
      }
    }

    if (!this.shoppingList) return;

    const item = this.shoppingList.createItem(this.newItemName);
    item.additional = {
      edit: false,
      editName: item.name,
    };

    this.newItemName = '';
    (this.$refs.newItemField as unknown as { resetValidation: () => void }).resetValidation();

    // TODO: Push event
  }

  // Log wrapper
  pushLog (action: LogAction, itemId: string): void {
    // TODO: Change log format to something more reasonable
    (this.$refs.log as ListLogs).pushLog(action, itemId);
  }

  // Suggestion autocomplete stuff
  // TODO: Make actual API call
  @Watch('suggestionSearch')
  suggestionAPICall (val: string): void {
    this.suggestionLoading = true;
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
      console.log(out, val);
      if (!out) return;
      this.suggestedItems.push(out);
      this.suggestionLoading = false;
    }, Math.random() * 10);
  }

  // checkItem (id: string, check: boolean): void {
  //   const item = this.shoppingList.items.find((t) => t.id === id);
  //   if (!item) {
  //     this.$toast.error('Something went horribly wrong...');
  //     return;
  //   }
  //   item.done = check;
  //   this.pushLog(check ? LogAction.MARK_ENTRY_DONE : LogAction.MARK_ENTRY_TODO, id);
  // }
  //
  // addListEntry (): void {
  //   const itemName = this.newItemName;
  //   console.log(this.newItemName);
  //   itemName.trim();
  //
  //   const id = uuidv4();
  //   this.shoppingList.items.push({
  //     name: itemName,
  //     done: false,
  //     id,
  //     additional: {
  //       edit: false,
  //       editName: itemName,
  //     },
  //   });
  //   this.newItemName = '';
  //
  //   this.pushLog(LogAction.CREATE_ENTRY, id);
  // }
  //
  // renameEntry (name: string, id: string): void {
  //   const item = this.shoppingList.items.find((t) => t.id === id);
  //   if (!item) return;
  //
  //   item.additional.edit = false;
  //   item.name = name;
  //   this.pushLog(LogAction.CHANGED_ENTRY_NAME, item.id);
  // }
  //
  // clearDone (): void {
  //   // TODO: Clear done items
  //   const del = this.shoppingList.items.filter((t) => t.done);
  //   this.shoppingList.items = this.shoppingList.items.filter((t) => !t.done);
  //
  //   del.forEach((t) => {
  //     this.pushLog(LogAction.DELETE_ENTRY, t.id);
  //   });
  // }
}
</script>
