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
    /**
     * Get the index of a shopping list by id. Returns -1 if no list was found!
     */
    findIndexById(id: string): number {
      return this.$state.findIndex((i) => i.listid === id);
    },
    /**
     * Get a shopping list by listId. Returns null if list was not found!
     */
    getListById(id: string): IShoppingList | null {
      const i = this.findIndexById(id);
      if (i === -1) return null;
      return this.$state[i];
    },
    patchById(id: string, list: IShoppingList): void {
      const i = this.findIndexById(id);
      if (i === -1) throw new Error(`Cannot find list "${id}" to patch!`);
      this.$state[i] = list;
    },
    removeById(id: string): IShoppingList {
      return this.$state.splice(this.$state.findIndex((l) => l.listid === id), 1)[0];
    },
    clear() {
      return this.$state.length = 0;
    }
  },
  persist: {
    beforeHydrate: () => {
      const jwtKey = 'feathers-jwt';
      if (localStorage.getItem(jwtKey) === null && sessionStorage.getItem(jwtKey) === null) {
        localStorage.removeItem('library');
        useLibraryStore().clear();
      }
    }
  },
});
