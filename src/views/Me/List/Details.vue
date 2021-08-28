<template>
  <div style="max-width: 800px; margin: auto" class="mt-4">
    <v-card outlined v-if="!listNotFound">
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

    <v-sheet outlined rounded class="mt-3 pa-2" v-if="!listNotFound">
      <div v-if="shoppingList === null"
           class="d-flex justify-center align-items">
        Loading
        <v-progress-circular color="primary" :size="25" :width="3" indeterminate
                             class="ml-2"></v-progress-circular>
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
    <div v-else class="text-center mt-16">
      <div class="header">404</div>
      <div class="text-subtitle-1">List not found.</div>
      <p>We can't find this list in our database.</p>
      <v-btn outlined color="primary" rounded width="300px" @click="$router.push({ name: 'my lists' })">Go to my lists</v-btn>
    </div>

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
import vuedraggable from 'vuedraggable';
import ListLogs, { LogAction } from '@/components/ListLogs.vue';
import TodoList from '@/components/TodoList.vue';
import feathersClient, { listService, User } from '@/feathers-client';
import ShoppingList, { IShoppingList } from '@/ShoppingList';

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
  private listNotFound = false

  async mounted (): Promise<void> {
    window.addEventListener('keydown', (e) => {
      if (e.key === '/') {
        e.preventDefault();
        console.log('shift+7 search open/close');
        // TODO: Implement search
      }
    });

    const list: IShoppingList[] | null = (await listService.find({ query: { listid: this.id } }).catch(() => {
      this.listNotFound = true;
    }) as { data: IShoppingList[] })?.data;
    console.log(list);
    if (!list || this.listNotFound) return;

    this.shoppingList = new ShoppingList(list[0].name, list[0].description, list[0].owner, list[0].items.items);

    this.user = await feathersClient.get('authentication').user;
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
      focused: false,
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
}
</script>

<style scoped>
.header {
  color: #3b3b3b;
  font-size: 7rem;
  line-height: 6rem;
}
</style>
