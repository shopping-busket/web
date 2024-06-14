<template>
  <div>
    <div class="d-flex">
      <div :class="isDarkTheme ? 'text-grey hr-sect-dark': 'hr-sect-light'" class="hr-sect mb-1">
        {{ label }} {{ getCountString(showCount) }}
      </div>
      <v-btn
        v-if="isClearable && userPermissions.canEditEntries && userPermissions.canDeleteEntries"
        class="mr-2"
        color="red"
        icon="mdi-trash-can-outline"
        size="x-small"
        variant="tonal"
        @click="emit('clear-done')"
      />
    </div>

    <div v-if="entries.length == 0" class="d-flex justify-center mb-2 text-grey-darken-1">
      No items in {{ label }}
    </div>

    <draggable
      v-model="entries"
      ghost-class="ghost"
      handle=".handle"
      item-key="id"
      @end="moveEntry"
    >
      <template #item="{element}">
        <v-card
          :class="{'entry-focus': element.additional.focused}"
          class="pa-2 mt-2 d-flex flex-row"
          style="align-items: center"
          variant="tonal"
          @click="focusEntry(element.id)"
        >
          <v-checkbox-btn
            v-show="userPermissions.canEditEntries"
            :model-value="checkedState"
            density="comfortable"
            @click="emit('check-entry', element.id, !checkedState)"
            @keydown.enter="emit('check-entry', element.id, !checkedState)"
          />
          <v-text-field
            v-if="element.additional.edit"
            v-model="element.additional.editName"
            autofocus
            class="w-100"
            color="primary"
            density="compact"
            hide-details
            label="Name"
            variant="outlined"
            @keydown.enter="emit('rename-entry', element.id); element.additional.edit = false"
            @keydown.esc="element.additional.edit = false; element.additional.editName = element.name"
          />
          <div v-else @dblclick="element.additional.edit = true">
            {{ element.name }}
          </div>

          <v-spacer />

          <v-btn
            v-if="element.additional.editName === element.name"
            v-show="userPermissions.canEditEntries"
            :icon="element.additional.edit ? 'mdi-pencil-outline' : 'mdi-pencil'"
            size="x-small"
            variant="text"
            @click="element.additional.edit = !element.additional.edit"
          />
          <div v-else class="d-flex">
            <v-btn
              icon
              size="small"
              variant="text"
              @click="emit('rename-entry', element.id); element.additional.edit = false"
              @keydown.enter="emit('rename-entry', element.id)"
            >
              <v-icon small>
                mdi-content-save
              </v-icon>
            </v-btn>
            <v-btn
              icon
              size="small"
              variant="text"
              @click="element.additional.edit = false; element.additional.editName = element.name;"
            >
              <v-icon small>
                mdi-close
              </v-icon>
            </v-btn>
          </div>
          <v-icon v-if="isMovable && userPermissions.canEditEntries" class="handle cursor-move"
                  size="small"
          >
            mdi-menu
          </v-icon>
        </v-card>
      </template>
    </draggable>
  </div>
</template>

<script lang="ts" setup>
import { VBtn, VCard, VCheckboxBtn, VIcon, VSpacer, VTextField } from 'vuetify/components';
import Draggable from 'vuedraggable';
import { ShoppingListItem } from '@/shoppinglist/ShoppingList';
import config from '../../config';
import { computed, ref, watch } from 'vue';
import { useTheme } from 'vuetify';
import { UserPermissions } from '@/components/ShareDialog.vue';

const props = withDefaults(defineProps<{
  modelValue: ShoppingListItem[],
  label: string,
  showCount?: boolean,
  checkedState?: boolean,
  isMovable?: boolean,
  isClearable?: boolean,
  userPermissions: UserPermissions,
}>(), {
  showCount: false,
  checkedState: false,
  isMovable: false,
  isClearable: false,
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: ShoppingListItem[]): void,
  (e: 'clear-done'): void
  (e: 'check-entry', id: string, done: boolean): void
  (e: 'rename-entry', id: string): void
  (e: 'move-entry', newDraggableIndex: number, oldDraggableIndex: number): void
}>();

const entries = computed({
  get() {
    return props.modelValue;
  },

  set(value: ShoppingListItem[]) {
    return emit('update:modelValue', value);
  }
});
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

const theme = useTheme();
const isDarkTheme = ref(theme.current.value.dark);

watch(theme.global.name, themeWatcher);

function themeWatcher() {
  isDarkTheme.value = theme.global.name.value === 'darkTheme';
}

function moveEntry(e: { newDraggableIndex: number, oldDraggableIndex: number }): void {
  // Return if entry wasn't moved
  if (e.newDraggableIndex === e.oldDraggableIndex) return;
  emit('move-entry', e.newDraggableIndex, e.oldDraggableIndex);
}

function getCountString(showCount = true): string {
  let count = entries.value.length;
  if (!showCount) count = 0;

  if (count === 0) return '';
  return ` ― ${count}`;
}

function focusEntry(id: string): void {
  // TODO: Make it possible to focus entries
  if (!config.supportFocus) return;

  const entry = entries.value.find((t) => t.id === id);
  if (!entry) return;

  entry.additional.focused = true;
}

/*function blurEntry(): void {
  // TODO: Make it possible to blur entries
}*/
</script>

<style lang="scss" scoped>
.hr-sect {
  display: flex;
  flex-basis: 100%;
  align-items: center;
  margin-left: 5px;
  font-variant: all-small-caps;

  &:after {
    content: "";
    flex-grow: 1;
    height: 1px;
    font-size: 0;
    line-height: 0;
    margin: 0 8px;
  }
}

.hr-sect-light:after {
  background: rgba(0, 0, 0, 0.35) !important;
}

.hr-sect-dark:after {
  background: rgba(255, 255, 255, 0.35) !important;
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
