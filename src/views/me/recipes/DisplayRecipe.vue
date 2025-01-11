<template>
  <v-dialog v-model="loading" class="w-100 h-100" fullscreen persistent>
    <div class="d-flex align-center justify-center w-screen h-screen">
      <v-sheet rounded class="d-flex flex-column align-center justify-center pa-2">
        <v-progress-circular indeterminate color="primary" />
        <div class="text-sm-subtitle-1 text-disabled mt-1">Searching for the cookbook</div>
      </v-sheet>
    </div>
  </v-dialog>

  <div class="pt-4 w-100 mb-16" style="max-width: 800px; margin: auto">
    <div v-if="recipe" class="w-100">
      <transition>
        <v-alert v-if="isEditing"
                 density="compact" color="primary" variant="outlined"
                 class="my-2" icon="mdi-text-box-edit-outline"
        >
          <div class="d-flex flex-row align-center">
            <div>
              You are editing this recipe!
            </div>
            <v-spacer/>
            <v-btn variant="text" color="primary" @click="exitEditMode" density="compact">
              Exit Edit Mode
            </v-btn>
            <v-btn variant="flat" color="primary" @click="exitEditMode" density="compact">
              Save
            </v-btn>
          </div>
        </v-alert>
      </transition>

      <v-btn v-if="isEditing" block class="mb-2" variant="tonal"
             @click="dialogPropertiesOpen = true"
      >
        <v-icon icon="mdi-cog" class="mr-2" />
        Recipe Properties
      </v-btn>

      <v-card variant="flat" class="border">
        <v-img
          color="surface-variant"
          height="200"
          src="https://cdn.vuetifyjs.com/docs/images/cards/purple-flowers.jpg"
          cover
        />

        <v-card-title class="d-flex flex-row justify-space-between align-center">
          <div class="d-flex align-center w-100">
            <v-btn icon="mdi-pencil" variant="text" density="compact"
                   v-if="editable"
                   @click="isEditing ? exitEditMode() : isEditing = true"
            />
            <div v-if="!isEditing">{{ recipe.title }}</div>
            <div v-else class="w-100">
              <v-text-field class="w-100" hide-details density="compact" color="primary"
                            variant="underlined" label="Title" v-model="recipe.title"
              />
            </div>
          </div>
          <div class="d-flex align-center">
            <div class="font-weight-regular text-sm-body-1 mr-2">{{ recipe.owner.fullName }}</div>
            <v-avatar :image="recipe.owner.avatarURI" />
          </div>
        </v-card-title>

        <v-card-text>
          <div class="mb-2">
            {{ recipe.description }}
          </div>

          <RecipeIngredientTable ref="ingredient-table" :recipe-id="props.id"
                                 :is-editing="isEditing"
          />

          <RecipeStep v-for="(step, i) in recipeSteps" :key="step.id"
                      v-model="recipeSteps[i]" @deleted="() => recipeSteps.splice(i, 1)"
                      :editable="editable"
                      :number="i+1"
                      class="mt-2"
          />
          <transition appear>
            <v-btn v-if="editable" @click="recipeStepAdd()"
                   variant="tonal" block color="primary" class="mt-2"
            >
              <v-icon icon="mdi-format-list-bulleted-type" />
              Add Step
            </v-btn>
          </transition>
        </v-card-text>
      </v-card>
    </div>
  </div>

  <v-dialog v-model="dialogPropertiesOpen"
            fullscreen
            transition="dialog-bottom-transition"
            persistent
            close-on-back
  >
    <v-card>
      <v-toolbar color="primary" density="compact">
        <v-btn
          icon="mdi-close"
          @click="dialogPropertiesOpen = false"
        />

        <v-toolbar-title>Recipe Properties</v-toolbar-title>

        <v-spacer></v-spacer>

        <v-toolbar-items>
          <v-btn
            text="Save"
            variant="text"
            @click="dialogPropertiesOpen = false"
          />
        </v-toolbar-items>
      </v-toolbar>

      <div class="mx-2">
        <div class="my-2">Properties let you change aspects about the recipe</div>

        <div class="d-flex flex-row align-center">
          <v-btn-toggle density="compact" variant="flat" color="primary">
            <v-btn>
              <v-icon icon="mdi-pot-steam-outline" />
              Cooking
            </v-btn>
            <v-btn>
              <v-icon icon="mdi-chef-hat" />
              Baking
            </v-btn>
          </v-btn-toggle>

          <div class="ml-2">Choose recipe type</div>
        </div>
      </div>
    </v-card>
  </v-dialog>

  <v-dialog v-model="dialogSaveOpen" max-width="400" persistant>
    <v-card title="Save?" text="Do you want to save the changes or discard them?">
      <v-card-actions>
        <v-btn variant="text" color="red"
               @click="dialogSaveOpen = false; discardRecipeChanges()"
        >
          Discard
        </v-btn>
        <v-btn variant="tonal" color="primary"
               @click="dialogSaveOpen = false; saveRecipeChangesToServer()"
        >
          Save
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import { IRecipe, IRecipeStep } from '@/shoppinglist/recipes/types';
import { inject, onMounted, ref, Ref, useTemplateRef } from 'vue';
import feathersClient, { Service } from '@/feathers-client';
import { Route } from '@/router';
import { useToast } from 'vue-toastification';
import { useRouter } from 'vue-router';
import RecipeIngredientTable from '@/components/RecipeIngredientTable.vue';
import RecipeStep from '@/components/RecipeStep.vue';
import _ from 'lodash';
import { userInjection } from '@/helpers/injectionKeys';

const toast = useToast();
const router = useRouter();

const props = defineProps<{
  id: number,
}>();

const loading = ref(true);
const recipe: Ref<IRecipe | null> = ref(null);
const recipeSteps: Ref<IRecipeStep[]> = ref([]);
const isEditing = ref(false);
const dialogPropertiesOpen = ref(false);
const dialogSaveOpen = ref(false);
const ingredientTable = useTemplateRef('ingredient-table');
const user = inject(userInjection);
const editable = ref(true);

onMounted(async () => {
  await fetchRecipe();
  loading.value = false;
  if (recipe.value?.owner.uuid == user?.uuid) {
    console.log('recipe owner is authed user');
    editable.value = true;
  }
  console.log(recipeSteps.value);
});

async function fetchRecipe() {
  try {
    recipe.value = await feathersClient.service(Service.RECIPE).get(props.id);
    recipeSteps.value = (await feathersClient.service(Service.RECIPE_STEPS).find({
      query: {
        recipeId: props.id,
      },
    }) as IRecipeStep[]).sort((a, b) => a.stepNumber - b.stepNumber);
  } catch (e) {
    toast('Recipe not found!');
    await router.push({ name: Route.MY_RECIPES });
    console.log(e);
    console.error(`Failed to fetch recipe with id ${props.id}`);
  }
}

function exitEditMode() {
  isEditing.value = false;
  dialogSaveOpen.value = true;
}

async function discardRecipeChanges() {
  loading.value = true;
  ingredientTable.value?.discardEdit();
  await fetchRecipe();
  loading.value = false;
}

async function saveRecipeChangesToServer() {
  if (!recipe.value) throw new Error('Recipe should not be null at this point: saveRecipeChangesToServer!');
  loading.value = true;
  await feathersClient.service(Service.RECIPE).patch(recipe.value.id, {
    title: recipe.value.title,
    description: recipe.value.description,
  });
  await ingredientTable.value?.save();

  await fetchRecipe();
  loading.value = false;
}

async function recipeStepAdd() {
  loading.value = true;
  recipeSteps.value.push(await feathersClient.service(Service.RECIPE_STEPS).create({
    title: 'Title',
    content: '...',
    recipeId: props.id,
    stepNumber: (_.last(recipeSteps.value)?.stepNumber ?? 0) + 1,
  } as Partial<IRecipeStep>));
  loading.value = false;
}
</script>

<style scoped>
.v-enter-active,
.v-leave-active {
  transition: all 0.3s ease;
}

.v-enter-from {
  transform: translateY(-100px);
}

.v-leave-to {
  opacity: 0;
}
</style>
