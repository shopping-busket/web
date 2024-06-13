import { DBSchema, IDBPDatabase, openDB } from 'idb';
import { IShoppingList, IShoppingListItem } from '@/shoppinglist/ShoppingList';

export interface OfflineDB extends DBSchema {
  'shopping-list': {
    key: string,
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
    if (await this.db?.put('shopping-list', shoppingList, shoppingList.listid) === undefined)
      return Promise.reject()
  }

  async tryPutEvents(events: EventData[]) {
    console.log(`store: ${events}`);
    const tx = this.db?.transaction('event', 'readwrite')
    if (tx === undefined) return Promise.reject()

    const promises: Promise<number | void>[] = []
    events.forEach((e) => promises.push(tx.store.put(e)))
    promises.push(tx.done)
    await Promise.all(promises)
  }
}

const store = new OfflineStore()
export default store;
