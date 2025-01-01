<template>
  <div v-if="loading" class="d-flex w-100 flex-column my-8 align-center">
    <v-progress-circular indeterminate color="primary" class="mb-2" />
    <div>Searching for the salt</div>
  </div>

  <transition name="bounce">
    <div v-if="!loading">
      <v-alert v-if="!addToListAvailable"
               density="compact" color="primary" variant="outlined"
               class="my-2" icon="mdi-basket-off-outline">
        "Add to list" is not available when not logged in.
      </v-alert>

      <div class="d-flex flex-row align-center">
        Ingredients for
        <v-number-input style="max-width: 5rem" class="mx-2"
                        variant="outlined" control-variant="stacked"
                        hide-details
                        density="compact"
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
          <th class="text-left" v-if="addToListAvailable">
            Add to list
          </th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="ingredient in ingredients" :key="ingredient.id">
          <td :title="ingredient.hint">
            <span :style="ingredient.hint ? 'border-bottom: 1px dotted #000;' : ''">
              {{ ingredient.name }}
            </span>
          </td>
          <td>{{ ingredient.amount }} {{ ingredient.unit }}</td>
          <td  v-if="addToListAvailable">
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
                  v-for="(library, index) in shoppingListLibary"
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
import { IIngredient } from '@/shoppinglist/recipes/types';
import feathersClient, { FeathersError, Service } from '@/feathers-client';
import { comparatorSortAlphabetically } from '@/helpers/utils';
import { EventType, LogEvent } from '@/shoppinglist/events';
import { v4 as uuidv4 } from 'uuid';
import { LibraryEntry } from '@/views/me/list/MyLists.vue';
import { VNumberInput } from 'vuetify/labs/components';

const props = defineProps<{
  recipeId: number,
}>();

const shoppingListLibary: Ref<LibraryEntry[]> = ref([]);

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
  ingredients.value = baseIngredients.value.map((ingredient) => {
    return {
      ...ingredient,
      amount: (ingredient.amount ?? 1) * (portions.value / BASE_PORTION_SIZE),
    };
  });
  console.log(portions, ingredients.value);
}

//region shopping list library (add to basket)
async function fetchShoppingListLibrary() {
  const library = (await feathersClient.service(Service.LIBRARY).find()) as LibraryEntry[];
  // TODO: FILTER OUT LISTS WHERE USER DOES NOT HAVE ADD ITEM PERMISSION
  shoppingListLibary.value = library.sort((a, b) => comparatorSortAlphabetically(a.list.name, b.list.name));
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
