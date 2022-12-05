<template>
  <div>
    <div class="hr-sect mb-1">
      <v-btn
        v-if="!isTodoList" outlined color="red" x-small class="mr-2"
        @click="emit('clear-done')"
      >
        <v-icon small>
          mdi-trash-can-outline
        </v-icon>
      </v-btn>
      {{ label }} {{ getCountString(!isTodoList) }}
    </div>

    <draggable
      :is="draggable"
      v-model="/* eslint-disable vue/no-mutating-props */props.shoppingList.entries" :animation="0"
      handle=".handle"
      ghost-class="ghost" @end="moveEntry"
    >
      <transition-group type="transition" name="flip-list">
        <div
          v-for="entry in shoppingList.entries.filter((t) => t.done === !isTodoList)"
          :key="entry.id"
        >
          <v-card
            v-click-outside="blurEntry"
            outlined
            rounded
            class="d-flex flex-row align-center pa-2 mt-2"
            :class="{'entry-focus': entry.additional.focused}"
            @click="focusEntry(entry.id)"
          >
            <v-checkbox
              dense class="ma-0 pa-0" style="height: 24px" :input-value="entry.done"
              @click="emit('check-entry', entry.id, isTodoList)"
              @keydown.enter="emit('check-entry', entry.id, isTodoList)"
            />
            <v-text-field
              v-if="entry.additional.edit"
              v-model="entry.additional.editName"
              outlined
              dense
              color="primary"
              label="Name"
              hide-details
              autofocus
              @keydown.enter="emit('rename-entry', entry.id)"
              @keydown.esc="entry.additional.edit = false; entry.additional.editName = entry.name"
            />
            <div v-else @dblclick="entry.additional.edit = true">
              {{ entry.name }}
            </div>
            <v-btn
              v-if="entry.additional.editName === entry.name" icon small
              @click="entry.additional.edit = !entry.additional.edit"
            >
              <v-icon small>
                {{
                  entry.additional.edit ? 'mdi-pencil-outline' : 'mdi-pencil'
                }}
              </v-icon>
            </v-btn>
            <div v-else>
              <v-btn
                icon
                small
                @click="emit('rename-entry', entry.id)"
                @keydown.enter="emit('rename-entry', entry.id)"
              >
                <v-icon small>
                  mdi-content-save
                </v-icon>
              </v-btn>
              <v-btn
                icon
                small
                @click="entry.additional.edit = false; entry.additional.editName = entry.name;"
              >
                <v-icon small>
                  mdi-close
                </v-icon>
              </v-btn>
            </div>
            <v-spacer />
            <v-icon v-if="isTodoList" small class="handle cursor-move">
              mdi-menu
            </v-icon>
          </v-card>
        </div>
      </transition-group>
    </draggable>
  </div>
</template>

<script lang="ts" setup>
import { VBtn, VCard, VCheckbox, VIcon, VTextField, } from 'vuetify/components';
import draggable from 'vuedraggable';
import ShoppingList from '@/shoppinglist/ShoppingList';
import config from '../../config';

const props = withDefaults(defineProps<{
  shoppingList: ShoppingList,
  label: string,
  isTodoList?: boolean,
}>(), {
  isTodoList: false,
});

const emit = defineEmits<{
  (e: 'clear-done'): void
  (e: 'check-entry', id: string, done: boolean): void
  (e: 'rename-entry', id: string): void
  (e: 'move-entry', newDraggableIndex: number, oldDraggableIndex: number): void
}>();

// TODO: Focusing/Blurring in onMounted()
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

function moveEntry(e: { newDraggableIndex: number, oldDraggableIndex: number }): void {
  // Return if entry wasn't moved
  if (e.newDraggableIndex === e.oldDraggableIndex) return;
  emit('move-entry', e.newDraggableIndex, e.oldDraggableIndex);
}

function getCountString(done: boolean): string {
  const count = props.shoppingList?.entries.filter((t) => t.done === done).length;

  if (count === 0) return '';
  return ` ― ${count}`;
}

function focusEntry(id: string): void {
  // TODO: Make it possible to focus entries
  if (!config.supportFocus) return;

  const entry = props.shoppingList?.entries.find((t) => t.id === id);
  if (!entry) return;

  entry.additional.focused = true;
}

function blurEntry(): void {
  // TODO: Make it possible to blur entries
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

.entry-focus {
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
