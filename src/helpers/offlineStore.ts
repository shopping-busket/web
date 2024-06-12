import { DBSchema, IDBPDatabase, openDB } from 'idb';

interface MyDB extends DBSchema {
  'favourite-number': {
    key: string;
    value: number;
  };
  products: {
    value: {
      name: string;
      price: number;
      productCode: string;
    };
    key: string;
    indexes: { 'by-price': number };
  };
}

export class OfflineStore {
  private db: IDBPDatabase<MyDB> | null = null;

  async create() {
    this.db = await openDB<MyDB>('testdb', 1, {
      upgrade(db) {
        db.createObjectStore('favourite-number');

        const productStore = db.createObjectStore('products', {
          keyPath: 'productCode',
        });
        productStore.createIndex('by-price', 'price');
      },
    });
  }

  async insert() {
    const r = await this.db!!.put('favourite-number', 7, 'Jen');
    console.log(r);
  }
}
