import { defineStore } from 'pinia';
import { IIngredient, IRecipe, IRecipeStep } from '@/shoppinglist/recipes/types';
import _ from 'lodash';

export interface RecipesStore {
  recipes: {
    [recipeId: string]: IRecipe,
  },
  ingredients: {
    [recipeId: string]: IIngredient[],
  },
  steps: {
    [recipeId: string]: IRecipeStep[],
  },
}

export interface StoredRecipe {
  recipe: IRecipe,
  ingredients: IIngredient[],
  steps: IRecipeStep[],
}

export const useRecipesStore = defineStore('recipeStore', {
  state: (): RecipesStore => ({
    recipes: {},
    ingredients: {},
    steps: {},
  }),
  actions: {
    get(id: number): StoredRecipe {
      return {
        recipe: this.$state.recipes[id],
        ingredients: this.$state.ingredients[id],
        steps: this.$state.steps[id],
      };
    },
    getAllRecipes(): IRecipe[] {
      return Object.values(this.$state.recipes);
    },
    pushRecipes(recipes: IRecipe[]) {
      recipes.forEach(recipe => this.pushOrUpdateRecipe(recipe));
    },
    pushOrUpdateRecipe(recipe: IRecipe) {
      this.$state.recipes[recipe.id] = recipe;
    },
    pushOrUpdateRecipeSteps(steps: IRecipeStep[]) {
      if(steps.length === 0)
        throw new RangeError("at least 1 step has to be specified!");
      if (!_.every(steps, { 'recipeId': steps[0].recipeId })) {
        throw new Error('[useRecipesStore.pushOrUpdateRecipeSteps] recipeId has to be equal across all recipeSteps!');
      }

      if (!this.$state.steps[steps[0].recipeId]) this.$state.steps[steps[0].recipeId] = [];
      this.$state.steps[steps[0].recipeId].push(...steps);
    },
    pushOrUpdateIngredients(ingredients: IIngredient[]) {
      if(ingredients.length === 0)
        throw new RangeError("at least 1 ingredient has to be specified!");
      if (!_.every(ingredients, { 'recipeId': ingredients[0].recipeId })) {
        throw new Error('[useRecipesStore.pushOrUpdateIngredients] recipeId has to be equal across all ingredients!');
      }

      if (!this.$state.ingredients[ingredients[0].recipeId]) this.$state.ingredients[ingredients[0].recipeId] = [];
      this.$state.ingredients[ingredients[0].recipeId].push(...ingredients);
    },
    removeRecipe(id: number) {
      delete this.$state.recipes[id];
      delete this.$state.ingredients[id];
      delete this.$state.steps[id];
    },
  },
  persist: true,
});
