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
        <div v-if="isEditing" class="my-2">
          <v-alert
            class="mb-2"
            density="compact" color="primary" variant="outlined"
            icon="mdi-text-box-edit-outline"
            text="You are editing this recipe!"
          />

          <v-btn variant="text" color="primary" @click="exitEditMode" class="mb-2" block>
            Exit Edit Mode
          </v-btn>
          <v-btn variant="flat" color="primary" @click="exitEditMode" block>
            Save
          </v-btn>
        </div>
      </transition>

      <transition appear>
        <v-btn v-if="editable && !isEditing"
               @click="isEditing = true"
               block color="primary" variant="outlined" text="Edit"
               class="mb-2"
        />
      </transition>

      <v-btn v-if="isEditing" block class="mb-2" variant="tonal"
             @click="dialogPropertiesOpen = true"
      >
        <v-icon icon="mdi-cog" class="mr-2" />
        Recipe Properties
      </v-btn>

      <transition appear>
        <v-alert variant="text" color="primary" icon="mdi-information-outline"
                 density="compact"
                 class="mb-2"
                 v-if="!feathersClient.io.connected"
        >
          You are offline. This recipe might be outdated!
        </v-alert>
      </transition>

      <v-card variant="flat" class="border">
        <div
          v-if="recipe.headerImagePath || isEditing"
          :style="{height: `${headerImageHeight}px`}" class="w-100 position-relative"
          @click="chooseHeaderImage"
        >
          <transition appear name="fade">
            <v-img
              :lazy-src="img"
              color="surface-variant"
              :height="headerImageHeight"
              v-if="(headerImageBase64 ?? recipe.headerImagePath)"
              :src="headerImageBase64 ?? `${config.getBackendURL()}${recipe.headerImagePath}`"
              cover
            />
          </transition>

          <transition appear name="fade">
            <div v-if="isEditing" class="img-overlay d-flex flex-column">
              <div style="text-shadow: 0 0 5px black">Click to upload</div>
              <v-btn color="red" @click.stop="deleteHeaderImage">Remove Image</v-btn>
            </div>
          </transition>
        </div>

        <v-card-title class="d-flex flex-row justify-space-between align-center">
          <div class="d-flex align-center w-100">
            <div v-if="!isEditing">{{ recipe.title }}</div>
            <div v-else class="w-100 mr-4">
              <v-text-field class="w-100" density="compact" color="primary"
                            variant="underlined" label="Title" v-model="recipe.title"
                            @update:model-value="recipe.title = truncate(recipe.title, {length: 32, omission: '…'})"
                            :counter="32"
              />
            </div>
          </div>
          <div class="d-flex align-center">
            <div class="font-weight-regular text-sm-body-1 mr-2">{{ recipe.owner.fullName }}</div>
            <v-avatar :image="recipe.owner.avatarURI" />
          </div>
        </v-card-title>

        <v-card-text>
          <v-textarea
            v-if="isEditing"
            v-model="recipe.description"
            color="primary"
            height="80px"
            label="Description"
            :counter="255"
            @update:model-value="recipe.description = truncate(recipe.description,
            {length: 255, omission: '…'}
            )"
            no-resize
            variant="outlined"
            class="mb-2"
          />
          <div v-else class="mb-2">
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
import { onMounted, onUnmounted, ref, Ref, useTemplateRef } from 'vue';
import feathersClient, { Service } from '@/feathers-client';
import { Route } from '@/router';
import { useToast } from 'vue-toastification';
import { useRouter } from 'vue-router';
import RecipeIngredientTable from '@/components/RecipeIngredientTable.vue';
import RecipeStep from '@/components/RecipeStep.vue';
import _, { clamp, truncate } from 'lodash';
import config from '../../../../config';
import img from '@/assets/recipe-header-placeholder.jpg';
import { VTextarea } from 'vuetify/components';
import { useLoginStore } from '@/stores/login.store';
import { useRecipesStore } from '@/stores/recipes.store';

const toast = useToast();
const router = useRouter();
const loginStore = useLoginStore();
const recipesStore = useRecipesStore();

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
const editable = ref(false);
const headerImageFile: Ref<File | null> = ref(null);
const headerImageBase64: Ref<string | null> = ref(null);
const headerImageHeight = ref(300);

onMounted(async () => {
  await fetchRecipe();
  loading.value = false;
  if (recipe.value?.owner.uuid == loginStore.user?.uuid) {
    console.log('recipe owner is authed loginStore');
    editable.value = true;
  }

  resizeObserver.observe(document.body);
});

onUnmounted(() => {
  resizeObserver.disconnect();
});

const resizeObserver = new ResizeObserver(() => {
  headerImageHeight.value = clamp((window.innerWidth / 800) * 300, 150, 300);
});

async function fetchRecipe() {
  if (!feathersClient.io.connected) {
    const cached = recipesStore.get(props.id);
    if (cached === undefined) {
      toast('Recipe not found!');
      await router.push({ name: Route.MY_RECIPES });
      return;
    }

    recipe.value = cached.recipe;
    recipeSteps.value = cached.steps;
    return;
  }

  try {
    recipe.value = await feathersClient.service(Service.RECIPE).get(props.id);
    recipesStore.pushOrUpdateRecipe(recipe.value!);

    recipeSteps.value = (await feathersClient.service(Service.RECIPE_STEPS).find({
      query: {
        recipeId: props.id,
      },
    }) as IRecipeStep[]).sort((a, b) => a.stepNumber - b.stepNumber);
    if (recipeSteps.value.length > 0) {
      recipesStore.pushOrUpdateRecipeSteps(recipeSteps.value!);
    }
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

  await saveHeaderImage();

  // Since the recipe is fetched here, we don't need to manually update the stores - the fetch will
  // do it for us!
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

async function toBase64(file: Blob): Promise<string | null> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string | null);
    reader.onerror = error => reject(error);
  });
}

async function chooseHeaderImage() {
  if (!isEditing.value) return;
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/jpeg';
  input.click();

  input.onchange = async () => {
    if ((input.files ?? []).length <= 0) return;
    headerImageFile.value = input.files?.item(0) ?? null;
    if (headerImageFile.value) {
      headerImageBase64.value = await toBase64(headerImageFile.value);
    }
  };
}

async function saveHeaderImage() {
  if (headerImageFile.value == null) return;
  const formData = new FormData();
  formData.append('file', headerImageFile.value);
  formData.append('category', 'recipe-header');
  formData.append('alt', 'Test Alt');
  formData.append('note', 'Test Note');
  formData.append('recipeId', props.id.toString());

  await fetch(`${config.httpProtocol}://${config.backend}/file-upload`, {
    method: 'POST',
    body: formData,
    headers: {
      'Authorization': `Bearer ${await feathersClient.authentication.getAccessToken()}`,
    }
  });

  headerImageFile.value = null;
  // We don't clear headerImageBase64 here, because the server takes some time to create the file
  // and serve it.
  // Before the server serves the new file, the old, cached one is returned.
  // We fake instantly updating the image by using the base64 version
}

async function deleteHeaderImage() {
  try {
    await feathersClient.service('file-upload').remove(props.id, {
      query: {
        category: 'recipe-header',
      }
    });
  } catch (e) {
    console.warn(e);
    console.warn('Attempted to delete a header, which is not on the server!');
  }

  if (!recipe.value) return;
  recipe.value.headerImagePath = null;
  recipe.value.headerImageNote = null;
  recipe.value.headerImageAlt = null;

  headerImageFile.value = null;
  headerImageBase64.value = null;
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 700ms ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

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

.img-overlay {
  cursor: pointer;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(var(--v-theme-primary), 20%);
  border: rgb(var(--v-theme-primary)) 5px dashed;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 2rem;
  color: white;
  font-weight: bold;
}
</style>
