<template>
  <div class="pt-4 w-100" style="max-width: 800px; margin: auto">
    <div v-if="!recipe" class="d-flex flex-column align-center justify-center w-100 mt-16">
      <v-progress-circular indeterminate color="primary" />
      <div class="text-sm-subtitle-1 text-disabled mt-1">Looking for ingredients</div>
    </div>

    <div v-else class="w-100">
      <v-card variant="flat" class="border">
        <v-img
          color="surface-variant"
          height="200"
          src="https://cdn.vuetifyjs.com/docs/images/cards/purple-flowers.jpg"
          cover
        />

        <v-card-title class="d-flex flex-row justify-space-between align-center">
          <div>
            {{ recipe.title }}
          </div>
          <div class="d-flex align-center">
            <div class="font-weight-regular text-sm-body-1 mr-2">{{ recipe.owner.fullName }}</div>
            <v-avatar :image="recipe.owner.avatarURI" />
          </div>
        </v-card-title>


        <v-card-text>
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

          <div class="mb-2">
            {{ recipe.description }}
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
              <th class="text-left">
                Add to list
              </th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="ingredient in ingredients" :key="ingredient.id">
              <td>{{ ingredient.name }}</td>
              <td>{{ ingredient.amount }} {{ ingredient.unit }}</td>
              <td>
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
        </v-card-text>
      </v-card>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { IIngredient, IRecipe } from '@/shoppinglist/recipes/types';
import { onMounted, ref, Ref } from 'vue';
import feathersClient, { Service } from '@/feathers-client';
import { Route } from '@/router';
import { useToast } from 'vue-toastification';
import { useRouter } from 'vue-router';
import { VNumberInput } from 'vuetify/labs/components';
import { LibraryEntry } from '@/views/me/list/MyLists.vue';
import { comparatorSortAlphabetically } from '@/helpers/utils';
import { EventType, LogEvent } from '@/shoppinglist/events';
import { v4 as uuidv4 } from 'uuid';

const toast = useToast();
const router = useRouter();

const props = defineProps<{
  id: number,
}>();

const shoppingListLibary: Ref<LibraryEntry[]> = ref([]);
// These ingredients are not displayed but also not altered (for portions)
const baseIngredients: Ref<IIngredient[]> = ref([]);
const ingredients: Ref<IIngredient[]> = ref([]);
const recipe: Ref<IRecipe | null> = ref(null);
const portions = ref(4);
const BASE_PORTION_SIZE = 4;

onMounted(async () => {
  await fetchRecipe();
  await fetchShoppingListLibrary();
});

async function fetchRecipe() {
  try {
    recipe.value = await feathersClient.service(Service.RECIPE).get(props.id);
  } catch (e) {
    toast('Recipe not found!');
    await router.push({ name: Route.MY_RECIPES });
    console.error(`Failed to fetch recipe with id ${props.id}`);
  }

  baseIngredients.value = await feathersClient.service(Service.INGREDIENTS).find({
    query: {
      recipeId: props.id
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
