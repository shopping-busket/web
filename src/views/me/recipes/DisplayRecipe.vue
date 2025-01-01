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
          <div class="mb-2">
            {{ recipe.description }}
          </div>

          <RecipeIngredientTable :recipe-id="props.id" />

          <v-card v-for="step in recipeSteps" :key="step.id" variant="outlined">
            <v-img
              color="surface-variant"
              height="150"
              src="https://cdn.vuetifyjs.com/docs/images/cards/purple-flowers.jpg"
              cover
            />

            <v-card-title>
              Step {{ step.stepNumber }}: {{ step.title }}
            </v-card-title>

            <v-card-text v-html="step.content" />
          </v-card>

        </v-card-text>
      </v-card>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { IRecipe, IRecipeStep } from '@/shoppinglist/recipes/types';
import { onMounted, ref, Ref } from 'vue';
import feathersClient, { Service } from '@/feathers-client';
import { Route } from '@/router';
import { useToast } from 'vue-toastification';
import { useRouter } from 'vue-router';
import RecipeIngredientTable from '@/components/RecipeIngredientTable.vue';

const toast = useToast();
const router = useRouter();

const props = defineProps<{
  id: number,
}>();

// These ingredients are not displayed but also not altered (for portions)
const recipe: Ref<IRecipe | null> = ref(null);
const recipeSteps: Ref<IRecipeStep[]> = ref([]);

onMounted(async () => {
  await fetchRecipe();
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
</script>
