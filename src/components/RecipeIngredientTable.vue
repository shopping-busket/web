<template>
  <div v-if="loading" class="d-flex w-100 flex-column my-8 align-center">
    <v-progress-circular indeterminate color="primary" class="mb-2" />
    <div>Gatherig ingredients</div>
  </div>

  <transition name="bounce">
    <div v-if="!loading">
      <v-alert v-if="!addToListAvailable"
               density="compact" color="primary" variant="outlined"
               class="my-2" icon="mdi-basket-off-outline"
      >
        "Add to list" is not available when not logged in.
      </v-alert>

      <div class="d-flex flex-row align-center">
        Ingredients for
        <v-number-input style="max-width: 5rem" class="mx-2"
                        variant="outlined" control-variant="stacked"
                        hide-details
                        density="compact"
                        :step="1"
                        persistent-counter
                        :max="99" :min="1"
                        v-model="portions"
                        @update:model-value="recalculatePortions"
        />
        portions
      </div>

      <v-table>
        <thead>
        <tr>
          <th class="text-left">
            Ingredient
          </th>
          <th class="text-left">
            Amount
          </th>
          <th class="text-left" style="max-width: 5.5rem;" v-if="addToListAvailable">
            <span v-if="props.isEditing">Proportional to portion size?</span>
            <span v-else>Add to list</span>
          </th>
          <th v-if="props.isEditing" style="max-width: 2rem">
            <v-icon icon="mdi-trash-can-outline" />
          </th>
        </tr>
        </thead>
        <tbody v-if="isEditing">
        <tr v-for="(ingredient, i) in ingredients.filter(ing => ing.flag !== CrudFlag.DELETE)"
            :key="ingredient.id"
        >
          <td>
            <v-text-field density="compact" label="Ingredient" variant="underlined" hide-details
                          v-model="ingredient.name"
            />
          </td>
          <td class="d-flex flex-row w-full align-center">
            <div class="flex-grow-1">
              <v-text-field type="number" density="compact" hide-details color="primary"
                            variant="underlined" hide-spin-buttons label="Amount" reverse
                            v-model="ingredient.amount"
              />
            </div>
            <div style="width: 2rem" class="ml-1">
              <v-text-field density="compact" label="Unit"
                            variant="underlined" hide-details
                            v-model="ingredient.unit"
              />
            </div>
          </td>
          <td>
            <!-- TODO: IMPLEMENT -->
            <v-checkbox hide-details density="compact" color="primary" />
          </td>
          <td style="max-width: 2rem">
            <v-btn icon="mdi-trash-can-outline" variant="text" density="compact" color="red"
                   @click="e_deleteIngredient(ingredient, i)"
            />
          </td>
        </tr>

        <tr>
          <td colspan="4">
            <v-btn block variant="tonal" color="primary" @click="e_addEmptyIngredient">
              <v-icon icon="mdi-text-box-plus-outline" class="mr-2" />
              Add Ingredient
            </v-btn>
          </td>
        </tr>
        </tbody>

        <tbody v-else>
        <tr v-for="ingredient in ingredients" :key="ingredient.id">
          <td :title="ingredient.hint">
            <span :style="ingredient.hint ? 'border-bottom: 1px dotted #000;' : ''">
              {{ ingredient.name }}
            </span>
          </td>
          <td>{{ ingredient.amount }} {{ ingredient.unit }}</td>

          <td v-if="addToListAvailable">
            <v-menu>
              <template v-slot:activator="{ props }">
                <v-btn
                  variant="text"
                  v-bind="props"
                  icon="mdi-basket-plus-outline"
                />
              </template>
              <v-list>
                <v-list-item
                  v-for="(library, index) in shoppingListLibrary"
                  :key="index"
                  :value="index"
                  @click="addIngredientToList(ingredient, library.listId)"
                >
                  <v-list-item-title>{{ library.list.name }}</v-list-item-title>
                  <v-list-item-subtitle>{{ library.list.description }}</v-list-item-subtitle>
                </v-list-item>
              </v-list>
            </v-menu>
          </td>
        </tr>
        </tbody>
      </v-table>
    </div>
  </transition>
</template>

<script lang="ts" setup>
import { onMounted, ref, Ref } from 'vue';
import { CrudFlag, IIngredient } from '@/shoppinglist/recipes/types';
import feathersClient, { FeathersError, Service } from '@/feathers-client';
import { comparatorSortAlphabetically } from '@/helpers/utils';
import { EventType, LogEvent } from '@/shoppinglist/events';
import { v4 as uuidv4 } from 'uuid';
import { LibraryEntry } from '@/views/me/list/MyLists.vue';
import { VNumberInput } from 'vuetify/labs/components';
import _ from 'lodash';

const props = defineProps<{
  recipeId: number,
  isEditing: boolean,
}>();

const shoppingListLibrary: Ref<LibraryEntry[]> = ref([]);

const baseIngredients: Ref<IIngredient[]> = ref([]);
const ingredients: Ref<IIngredient[]> = ref([]);
const portions = ref(4);
const BASE_PORTION_SIZE = 4;
const loading = ref(true);
const addToListAvailable = ref(true);

onMounted(async () => {
  await fetchIngredients();
  try {
    await fetchShoppingListLibrary();
  } catch (e) {
    const err = e as FeathersError;
    if (err.code && err.code === 401 /* Unauthorized */) {
      // User is not logged in, we skip fetching "library"
      // and instead show an alert that "add to basket" is not available
      addToListAvailable.value = false;
    }
  }
  loading.value = false;
});

async function fetchIngredients() {
  baseIngredients.value = await feathersClient.service(Service.INGREDIENTS).find({
    query: {
      recipeId: props.recipeId
    }
  });
  recalculatePortions();
}

function recalculatePortions() {
  portions.value = Math.round(portions.value);
  ingredients.value = baseIngredients.value.map((ingredient) => {
    return {
      ...ingredient,
      amount: (ingredient.amount ?? 1) * (portions.value / BASE_PORTION_SIZE),
    };
  });
}

function discardEdit() {
  ingredients.value = baseIngredients.value;
}

async function save() {
  loading.value = true;

  // calling "create" with an array does not work for some reason, so we iterate
  await Promise.all(
    ingredients.value
      .filter(ing => ing.flag == CrudFlag.CREATE)
      .map(ing => _.omit(ing, ['id', 'flag']))
      .map(ing => feathersClient.service(Service.INGREDIENTS).create(ing))
  );

  await Promise.all(
    ingredients.value
      .filter(ing => ing.flag === undefined || (ing.flag !== CrudFlag.CREATE && ing.flag !== CrudFlag.DELETE))
      .map(ing => _.omit(ing, ['flag']))
      .map(ing => feathersClient.service(Service.INGREDIENTS).patch(ing.id, _.omit(ing, ['id'])))
  );

  await feathersClient.service(Service.INGREDIENTS).remove(null, {
    query: {
      id: {
        $in: ingredients.value
          .filter(ing => ing.flag == CrudFlag.DELETE)
          .map(ing => ing.id)
      }
    }
  });

  await fetchIngredients();
  loading.value = false;
}

//region shopping list library (add to basket)
async function fetchShoppingListLibrary() {
  const library = (await feathersClient.service(Service.LIBRARY).find()) as LibraryEntry[];
  // TODO: FILTER OUT LISTS WHERE USER DOES NOT HAVE ADD ITEM PERMISSION
  shoppingListLibrary.value = library.sort((a, b) => comparatorSortAlphabetically(a.list.name, b.list.name));
}

async function addIngredientToList(ingredient: IIngredient, listId: string) {
  await feathersClient.service(Service.EVENT).create([{
    listid: listId,
    eventData: {
      event: EventType.CREATE_ENTRY,
      entryId: uuidv4(),
      isoDate: (new Date()).toISOString(),
      state: {
        name: `${ingredient.name} (${ingredient.amount} ${ingredient.unit})`,
      },
      sender: uuidv4(),
    }
  }] as LogEvent[]);
}

//endregion

//region editing
function e_addEmptyIngredient() {
  ingredients.value.push({
    name: '',
    amount: 0,
    unit: '?',
    id: random(Number.MAX_VALUE - 100_000, Number.MAX_VALUE),
    recipeId: props.recipeId,
    flag: CrudFlag.CREATE,
  });
}

function e_deleteIngredient(ingredient: IIngredient, index: number) {
  if (ingredient.flag == CrudFlag.CREATE) {
    ingredients.value.splice(index, 1);
  } else {
    ingredient.flag = CrudFlag.DELETE;
  }
}

function random(min: number, max: number) {
  return Math.floor(Math.random() * (max - min)) + min;
}

//endregion

defineExpose({
  save,
  discardEdit,
});
</script>

<style scoped>
.bounce-enter-active {
  animation: bounce-in 500ms;
}

.bounce-leave-active {
  animation: bounce-in 500ms reverse;
}

@keyframes bounce-in {
  0% {
    transform: scale(0);
  }
  50% {
    transform: scale(1.125);
  }
  100% {
    transform: scale(1);
  }
}
</style>
