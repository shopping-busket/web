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

          <RecipeIngredientTable :recipe-id="props.id"/>
        </v-card-text>
      </v-card>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { IRecipe } from '@/shoppinglist/recipes/types';
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

onMounted(async () => {
  await fetchRecipe();
});

async function fetchRecipe() {
  try {
    recipe.value = await feathersClient.service(Service.RECIPE).get(props.id);
  } catch (e) {
    toast('Recipe not found!');
    await router.push({ name: Route.MY_RECIPES });
    console.error(`Failed to fetch recipe with id ${props.id}`);
  }
}
</script>
