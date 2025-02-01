import { defineStore } from 'pinia';
import { IShoppingList } from '@/shoppinglist/ShoppingList';

// You can name the return value of `defineStore()` anything you want,
// but it's best to use the name of the store and surround it with `use`
// and `Store` (e.g. `useUserStore`, `useCartStore`, `useProductStore`)
// the first argument is a unique id of the store across your application
export const useLibraryStore = defineStore('library', {
  state: (): IShoppingList[] => ([] as IShoppingList[]),
  actions: {
    updateLibrary(lists: IShoppingList[]) {
      this.$state = lists;
    },
    findIndexById(id: string): number {
      return this.$state.findIndex((i) => i.listid === id);
    },
    removeById(id: string): IShoppingList {
      return this.$state.splice(this.$state.findIndex((l) => l.listid === id), 1)[0];
    }
  },
  persist: true,
});
