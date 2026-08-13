<template>
  <div class="ma-auto pt-4" style="max-width: 70rem">
    <transition-group>
      <v-card
        v-for="recipe in recipes"
        :key="recipe.id"
        :ripple="true"
        class="mb-2 v-ripple py-2"
        hover
        @click="openRecipe(recipe)"
      >
        <v-list-item :title="recipe.title" class="pb-2"
                     :prepend-avatar="recipe.owner.avatarURI ?? defaultUserImg"
        >
          <template #append>
            <v-icon
              v-if="recipe.owner.uuid === authStore.user?.uuid"
              color="error"
              icon="mdi-trash-can-outline"
              @click.stop="removeRecipeDialog = {show: true, id: recipe.id}"
            />
          </template>
          <template #subtitle>
            <div class="d-flex">
              <div v-if="recipe.description">
                <span>{{ recipe.description }}</span>
                <span class="mx-1">•</span>
              </div>
              <div>by {{ recipe.owner.fullName }}</div>
            </div>
          </template>
        </v-list-item>
      </v-card>
    </transition-group>
    <v-card
      :ripple="true"
      class="d-flex justify-center flex-column align-center new-recipe-card"
      hover
      v-if="feathersClient.io.connected && authStore.isLoggedIn"
      @click="feathersClient.io.connected ? showNewListDialog() : toast('You are offline!')"
    >
      <div class="new-recipe-title">
        New Recipe
      </div>
      <v-icon icon="mdi-plus-circle-outline"/>
    </v-card>
    <transition appear>
      <v-alert variant="tonal" color="primary" icon="mdi-information-outline"
               v-if="!authStore.isLoggedIn"
      >
        Log in to create recipes
      </v-alert>
    </transition>
    <transition appear>
      <v-alert variant="tonal" color="primary" icon="mdi-information-outline"
               class="mt-2"
               v-if="!feathersClient.io.connected"
      >
        You are offline. Only recipes that you have viewed before are shown!
      </v-alert>
    </transition>

    <v-dialog v-model="dialogNewRecipe" max-width="550px">
      <v-card>
        <v-card-title>
          Create a new recipe
        </v-card-title>
        <v-card-subtitle>
          Name and title can be edited later.
        </v-card-subtitle>

        <v-form
          ref="dialogNewRecipeForm"
          v-model="dialogNewRecipeFormValid"
          validate-on="input"
          @submit.prevent="createRecipe()"
        >
          <v-card-text>
            <v-text-field
              v-model.trim="dialogNewRecipeData.title"
              :rules="rulesRecipeTitle"
              autofocus
              color="primary"
              counter="32"
              density="compact"
              label="Name"
              variant="outlined"
              @keyup.once="dialogNewRecipeForm?.validate()"
            />
            <v-textarea
              v-model="dialogNewRecipeData.description"
              color="primary"
              height="80px"
              label="Description"
              :counter="255"
              no-resize
              variant="outlined"
            />
          </v-card-text>

          <v-card-actions>
            <v-btn
              variant="text"
              @click.stop="dialogNewRecipe = false"
            >
              Cancel
            </v-btn>

            <v-spacer/>

            <v-btn
              :disabled="!dialogNewRecipeFormValid"
              color="primary"
              variant="flat"
              width="10em"
              type="submit"
            >
              Create
            </v-btn>
          </v-card-actions>
        </v-form>
      </v-card>
    </v-dialog>
  </div>

  <v-dialog v-model="loading" class="w-100 h-100" fullscreen persistent>
    <div class="d-flex align-center justify-center w-screen h-screen">
      <v-sheet rounded class="d-flex flex-column align-center justify-center pa-2">
        <v-progress-circular indeterminate color="primary"/>
        <div class="text-sm-subtitle-1 text-disabled mt-1">Loading</div>
      </v-sheet>
    </div>
  </v-dialog>

  <ConfirmationDialog v-model="removeRecipeDialog.show"
                      @confirm="deleteRecipe(removeRecipeDialog.id!)"
                      title="Are you sure that you want to delete this recipe?"
                      subtitle="You won't be able to get it back"/>
</template>

<script lang="ts" setup>
import feathersClient, {Service} from '@/feathers-client';
import {
  VBtn,
  VCard,
  VCardSubtitle,
  VCardText,
  VCardTitle,
  VDialog,
  VForm,
  VIcon,
  VListItem,
  VSpacer,
  VTextarea,
  VTextField
} from 'vuetify/components';
import {nextTick, onMounted, Ref, ref} from 'vue';
import {IRecipe, IRecipeOwner} from '@/shoppinglist/recipes/types';
import {useRouter} from 'vue-router';
import {Route} from '@/router';
import {useToast} from 'vue-toastification';
import defaultUserImg from '@/assets/avatar-placeholder.png';
import {useAuthStore} from '@/stores/auth.store';
import {useRecipesStore} from '@/stores/recipes.store';
import _ from 'lodash';
import ConfirmationDialog from "@/components/ConfirmationDialog.vue";

const router = useRouter();
const toast = useToast();
const authStore = useAuthStore();
const recipesStore = useRecipesStore();

const recipes: Ref<IRecipe[]> = ref([]);
const removeRecipeDialog: Ref<{
  show: boolean;
  id: number | null;
}> = ref({
  show: false,
  id: null,
});

const rulesRecipeTitle = [
  (val: string) => val.length >= 1 || 'Name has to have at least 1 character!',
];

const dialogNewRecipe = ref(false);
const dialogNewRecipeData = ref({
  title: '',
  description: '',
});
const dialogNewRecipeForm: Ref<VForm | null> = ref(null);
const dialogNewRecipeFormValid = ref(false);
const loading = ref(true);

feathersClient.on('connected', async () => {
  await loadRecipes();
});

onMounted(async () => {
  await loadRecipes();
  loading.value = false;
});

async function loadRecipes() {
  if (!feathersClient.io.connected) {
    recipes.value = recipesStore.getAllRecipes();
    return;
  }

  recipes.value = await feathersClient.service(Service.RECIPE).find()
}

async function openRecipe(recipe: IRecipe) {
  await router.push({
    name: Route.DISPLAY_RECIPE,
    params: {
      id: recipe.id,
    },
  });
}

async function showNewListDialog() {
  dialogNewRecipe.value = true;
  if (dialogNewRecipeData.value.title.length === 0) return;

  await nextTick(async () => {
    await dialogNewRecipeForm.value?.validate();
  });
}

async function createRecipe() {
  await dialogNewRecipeForm.value?.validate();
  if (!dialogNewRecipeFormValid.value) return;
  loading.value = true;

  const recipe = await feathersClient.service(Service.RECIPE).create({
    title: dialogNewRecipeData.value.title,
    description: dialogNewRecipeData.value.description,
  } as IRecipe) as IRecipe;
  recipesStore.pushRecipes([{
    ...recipe,
    owner: _.pick(authStore.user, ['fullName', 'uuid', 'avatarURI']) as IRecipeOwner
  }]);

  await openRecipe(recipe);
  loading.value = false;
}

async function deleteRecipe(id: number) {
  loading.value = true;

  await feathersClient.service(Service.RECIPE).remove(id);
  recipesStore.removeRecipe(id);
  await loadRecipes();

  loading.value = false;
}
</script>

<style lang="scss" scoped>
.title-dense {
  line-height: 1.2rem;
}

.new-recipe-card {
  height: 72px;
}

.new-recipe-title {
  font-size: 1.25rem;
  font-weight: bold;
}

.icon-height {
  height: 24px;
}

.v-enter-active,
.v-leave-active {
  transition: all 0.3s ease;
}

.v-enter-from {
  opacity: 0;
  transform: translateY(-100px);
}

.v-leave-to {
  opacity: 0;
}
</style>
