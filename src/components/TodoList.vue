<template>
  <div>
    <div class="hr-sect mb-1">
      <v-btn outlined color="red" x-small @click="shoppingList.clearDone()" class="mr-2" v-if="!isTodoList">
        <v-icon small>mdi-trash-can-outline</v-icon>
      </v-btn>
      {{ label }} {{ getCount(!isTodoList) }}
    </div>

    <vuedraggable v-model="shoppingList.items" :animation="0" handle=".handle"
                  ghost-class="ghost">
      <transition-group type="transition" name="flip-list">
        <div v-for="item in shoppingList.items.filter((t) => t.done === !isTodoList)" :key="item.id">
          <v-sheet outlined rounded class="d-flex flex-row align-center pa-2 mt-2">
            <v-checkbox dense class="ma-0 pa-0" style="height: 24px" :input-value="item.done"
                        @click="shoppingList.checkItem(item.id, isTodoList)"
                        @keydown.enter="shoppingList.checkItem(item.id, isTodoList)"/>
            <v-text-field outlined
                          dense
                          color="primary"
                          label="Name"
                          v-model="item.additional.editName"
                          v-if="item.additional.edit"
                          hide-details
                          @keydown.enter="renameItem(item.id)"
                          @keydown.esc="item.additional.edit = false; item.additional.editName = item.name"
                          autofocus/>
            <div v-else @dblclick="item.additional.edit = true">{{ item.name }}</div>
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
                     @click="renameItem(item.id)"
                     @keydown.enter="renameItem(item.id)"
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
            <v-icon small class="handle" v-if="isTodoList">mdi-menu</v-icon>
          </v-sheet>
        </div>
      </transition-group>
    </vuedraggable>
  </div>
</template>

<script lang="ts">

import { Component, Prop, Vue } from 'vue-property-decorator';
import vuedraggable from 'vuedraggable';
import ShoppingList from '@/ShoppingList';

@Component({
  components: {
    vuedraggable,
  },
})
export default class TodoList extends Vue {
  @Prop({ required: true }) private shoppingList: ShoppingList | undefined;
  @Prop({ required: true }) private label: string | undefined;
  @Prop({ default: false, type: Boolean }) private isTodoList: boolean | undefined;

  renameItem (id: string): void {
    this.$emit('rename', id);
  }

  getCount (done: boolean): string {
    const count = this.shoppingList?.items.filter((t) => t.done === done).length;

    if (count === 0) return '';
    return ` ― ${count}`;
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

//noinspection CssUnusedSymbol
.ghost {
  opacity: 0.5;
  background: #c8ebfb;
}

.done {
  color: #444;
  text-decoration: line-through;
}
</style>
