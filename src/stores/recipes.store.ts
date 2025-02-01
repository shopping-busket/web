import { defineStore } from 'pinia';
import { IRecipe } from '@/shoppinglist/recipes/types';

export interface RecipesStore {
  [recipeId: string]: IRecipe,
}

export const useRecipesStore = defineStore('recipeStore', {
  state: (): RecipesStore => ({}),
  actions: {
    getAll(): IRecipe[] {
      return Object.values(this.$state);
    },
    pushRecipe(recipe: IRecipe) {
      this.$state[recipe.id] = recipe;
    },
    removeRecipe(id: number) {
      delete this.$state[id];
    }
  },
  persist: true,
});
