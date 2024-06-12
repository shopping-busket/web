import { DBSchema, IDBPDatabase, openDB } from 'idb';
import { IShoppingList, IShoppingListItem } from '@/shoppinglist/ShoppingList';

export interface OfflineDB extends DBSchema {
  'shopping-list': {
    key: number,
    value: {
      listid: string,
      owner: string,
      name: string,
      description: string,
      entries: IShoppingListItem[]
    },
    indexes: { 'by-listid': string };
  };
}

export class OfflineStore {
  private db: IDBPDatabase<OfflineDB> | null = null;

  async create() {
    this.db = await openDB<OfflineDB>('busket-offline-store', 1, {
      upgrade(db) {
        const shoppingList = db.createObjectStore('shopping-list');
        shoppingList.createIndex('by-listid', 'listid');
      },
    });
  }

  async tryPutShoppingList(shoppingList: IShoppingList) {
    const r = await this.db!!.put('shopping-list', shoppingList, shoppingList.id);
    console.log(r);
  }
}

const store = new OfflineStore()
export default store;
