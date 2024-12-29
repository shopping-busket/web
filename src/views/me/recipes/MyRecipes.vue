<template>
  <div class="ma-auto pt-4" style="max-width: 70rem">
    <v-card
      v-for="recipe in recipes as IRecipe[]"
      :key="recipe.id"
      :ripple="true"
      class="mb-2 v-ripple pb-1 pt-1"
      hover
      variant="outlined"
      @click="openRecipe(recipe)"
    >
      <v-list-item :title="recipe.title" class="pb-2" :prepend-avatar="recipe.owner.avatarURI ?? defaultUserImg">
        <template #append>
          <!--          <v-icon-->
          <!--            color="red"-->
          <!--            :icon="recipe.owner === user?.uuid ? 'mdi-trash-can-outline' : 'mdi-exit-run'"-->
          <!--            @click.stop="removeListDialog = true; removeList = recipe"-->
          <!--          />-->
        </template>
        <template #subtitle>
          <div>by {{ recipe.owner.fullName }}</div>
          <div v-if="recipe.description">
            <div class="mx-2">•</div>
            <div>{{ recipe.description }}</div>
          </div>
        </template>
      </v-list-item>
    </v-card>
    <v-card
      :ripple="true"
      class="d-flex justify-center flex-column align-center new-recipe-card"
      hover
      variant="outlined"
      @click="feathersClient.io.connected ? showNewListDialog() : toast('You are offline!')"
    >
      <div class="new-recipe-title">
        New Recipe
      </div>
      <v-icon icon="mdi-plus-circle-outline" />
    </v-card>

    <v-dialog v-model="dialogNewRecipe" max-width="550px">
      <v-card>
        <v-card-title>
          Create a new recipe.
        </v-card-title>
        <v-card-subtitle>
          Name and title can be edited later.
        </v-card-subtitle>

        <v-card-text class="mt-1">
          <v-form
            ref="dialogNewRecipeForm"
            v-model="dialogNewRecipeFormValid"
            validate-on="input"
            @submit.prevent="createRecipe()"
          >
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
              counter
              height="80px"
              label="Description"
              no-resize
              variant="outlined"
            />
          </v-form>

          <div class="d-flex flex-row">
            <v-btn
              color="red"
              variant="text"
              @click="dialogNewRecipe = false"
            >
              Cancel
            </v-btn>

            <v-spacer />

            <v-btn
              :disabled="!dialogNewRecipeFormValid"
              color="primary"
              rounded
              variant="outlined"
              width="200px"
              @click="createRecipe(); dialogNewRecipe = false"
            >
              Create
            </v-btn>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>

  <!--<v-dialog v-model="removeListDialog" max-width="500px">
    <v-card
      :title="`Are you sure that you want to ${removeList?.owner === user?.uuid ? 'delete' : 'leave'} this list?`"
      :subtitle="removeList?.owner === user?.uuid ? 'You won\'t be able to get it back' : 'You will not be able to access it until you get another invite'"
    >
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" color="primary" @click="removeListDialog = false">
          Cancel
        </v-btn>

        <v-btn
          v-if="removeList"
          color="primary"
          variant="outlined"
          @click="removeList?.owner === user?.uuid ? deleteList(removeList.listid) : leaveFromList(removeList.listid); removeListDialog = false"
        >
          Yes, I am sure
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>-->
</template>

<script lang="ts" setup>
import feathersClient, { Service } from '@/feathers-client';
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
import { nextTick, onMounted, Ref, ref } from 'vue';
import { IRecipe } from '@/shoppinglist/recipes/types';
import { useRouter } from 'vue-router';
import { Route } from '@/router';
import { useToast } from 'vue-toastification';
import defaultUserImg from '@/assets/avatar-placeholder.png';

const router = useRouter();
const toast = useToast();

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
const recipes = ref([]);

onMounted(async () => {
  await fetchRecipes();
});

async function fetchRecipes() {
  recipes.value = await feathersClient.service(Service.RECIPE).find();
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
  // TODO
  toast('TODO');
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
</style>
