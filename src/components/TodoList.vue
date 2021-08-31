<template>
  <div>
    <div class="hr-sect mb-1">
      <v-btn outlined color="red" x-small @click="$emit('clearDone')" class="mr-2"
             v-if="!isTodoList">
        <v-icon small>mdi-trash-can-outline</v-icon>
      </v-btn>
      {{ label }} {{ getCount(!isTodoList) }}
    </div>

    <vuedraggable v-model="shoppingList.items" :animation="0" handle=".handle"
                  ghost-class="ghost">
      <transition-group type="transition" name="flip-list">
        <div v-for="entry in shoppingList.items.filter((t) => t.done === !isTodoList)"
             :key="entry.id">
          <v-sheet outlined
                   rounded
                   class="d-flex flex-row align-center pa-2 mt-2"
                   :class="{'item-focus': entry.additional.focused}"
                   @click="focusEntry(entry.id)"
          >
            <v-checkbox dense class="ma-0 pa-0" style="height: 24px" :input-value="entry.done"
                        @click="$emit('checkEntry', entry.id, isTodoList)"
                        @keydown.enter="$emit('checkEntry', entry.id, isTodoList)"/>
            <v-text-field outlined
                          dense
                          color="primary"
                          label="Name"
                          v-model="entry.additional.editName"
                          v-if="entry.additional.edit"
                          hide-details
                          @keydown.enter="renameEntry(entry.id)"
                          @keydown.esc="entry.additional.edit = false; entry.additional.editName = entry.name"
                          autofocus/>
            <div v-else @dblclick="entry.additional.edit = true">{{ entry.name }}</div>
            <v-btn icon small @click="entry.additional.edit = !entry.additional.edit"
                   v-if="entry.additional.editName === entry.name">
              <v-icon small>{{
                  entry.additional.edit ? 'mdi-pencil-outline' : 'mdi-pencil'
                }}
              </v-icon>
            </v-btn>
            <div v-else>
              <v-btn icon
                     small
                     @click="renameEntry(entry.id)"
                     @keydown.enter="renameEntry(entry.id)"
              >
                <v-icon small>
                  mdi-content-save
                </v-icon>
              </v-btn>
              <v-btn icon
                     small
                     @click="entry.additional.edit = false; entry.additional.editName = entry.name;"
              >
                <v-icon small>
                  mdi-close
                </v-icon>
              </v-btn>
            </div>
            <v-spacer></v-spacer>
            <v-icon small class="handle cursor-move" v-if="isTodoList">mdi-menu</v-icon>
          </v-sheet>
        </div>
      </transition-group>
    </vuedraggable>
  </div>
</template>

<script lang="ts">

import { Component, Prop, Vue } from 'vue-property-decorator';
import vuedraggable from 'vuedraggable';
import ShoppingList from '@/shoppinglist/ShoppingList';

@Component({
  components: {
    vuedraggable,
  },
})
export default class TodoList extends Vue {
  @Prop({ required: true }) private shoppingList: ShoppingList | undefined;
  @Prop({ required: true }) private label: string | undefined;
  @Prop({ default: false, type: Boolean }) private isTodoList: boolean | undefined;

  mounted (): void {
    // TODO: Unfocusing
    // window.addEventListener('click', (e) => {
    //   const focused = this.shoppingList?.items?.find((t) => t.additional.focused);
    //   if (!focused) return;
    //
    //   const rect = focused.getBoundingClientRect();
    //   // Below code checks if click is in clientRect
    //   if ((e.clientY < rect.top || e.clientY >= rect.bottom) && (e.clientX < rect.left || e.clientX >= rect.right)) {
    //     console.log('clicked outside');
    //
    //   }
    // });
  }

  renameEntry (id: string): void {
    this.$emit('renameEntry', id);
  }

  getCount (done: boolean): string {
    const count = this.shoppingList?.items.filter((t) => t.done === done).length;

    if (count === 0) return '';
    return ` ― ${count}`;
  }

  focusEntry (/* id: string */): void {
    // TODO: Make focusing possible. Unfocusing is impossible atm.
    // const item = this.shoppingList?.items.find((t) => t.id === id);
    // if (!item) return;
    //
    // console.log(id);
    //
    // item.additional.focused = true;
    // console.log('focus');
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

.item-focus {
  border: #01916d dashed 2px;
  background: rgba(1, 145, 109, .2);
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

.cursor-move {
  cursor: move;
}
</style>
