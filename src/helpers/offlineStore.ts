import { DBSchema, IDBPDatabase, openDB } from 'idb';
import { IShoppingList, IShoppingListItem } from '@/shoppinglist/ShoppingList';
import { EventData } from '@/shoppinglist/events';

export interface OfflineDB extends DBSchema {
  'shopping-list': {
    key: string,
    value: {
      listid: string,
      owner: string,
      name: string,
      description: string,
      entries: IShoppingListItem[]
      checkedEntries: IShoppingListItem[]
    },
    indexes: { 'by-listid': string };
  };

  'event': {
    key: number,
    value: EventData,
  };
}

export class OfflineStore {
  public db: IDBPDatabase<OfflineDB> | null = null;

  async create() {
    this.db = await openDB<OfflineDB>('busket-offline-store', 1, {
      upgrade(db) {
        const shoppingList = db.createObjectStore('shopping-list');
        shoppingList.createIndex('by-listid', 'listid');

        db.createObjectStore('event', {
          autoIncrement: true,
          keyPath: 'id'
        });
      },
    });
  }

  async tryPutShoppingList(shoppingList: IShoppingList) {
    if (await this.db?.put('shopping-list', shoppingList, shoppingList.listid) === undefined) {
      return Promise.reject();
    }
  }

  async tryPutEvents(events: EventData[]): Promise<(number | void)[]> {
    console.log('store: ', events);
    const tx = this.db?.transaction('event', 'readwrite');
    if (tx === undefined) return Promise.reject();

    const promises: Promise<number | void>[] = [];
    events.forEach((e) => promises.push(tx.store.put(e)));
    promises.push(tx.done);
    const r = await Promise.all(promises);
    console.log('promises', r);
    return r;
  }
}

const store = new OfflineStore();
export default store;
