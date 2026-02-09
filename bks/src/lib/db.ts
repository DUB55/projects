import { Book } from '@/types/book';

const DB_NAME = 'BKS_Database';
const DB_VERSION = 1;
const STORE_NAME = 'books';

export class BookDatabase {
    private db: IDBDatabase | null = null;

    async init(): Promise<void> {
        if (this.db) return;
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };
            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                }
            };
        });
    }

    async getAllBooks(): Promise<Book[]> {
        try {
            await this.init();
            if (!this.db) return [];
            return new Promise((resolve, reject) => {
                const transaction = this.db!.transaction(STORE_NAME, 'readonly');
                const store = transaction.objectStore(STORE_NAME);
                const request = store.getAll();
                request.onsuccess = () => resolve(request.result || []);
                request.onerror = () => reject(request.error);
            });
        } catch (e) {
            console.error("IndexedDB getAllBooks error:", e);
            return [];
        }
    }

    async getBookById(id: string): Promise<Book | null> {
        try {
            await this.init();
            if (!this.db) return null;
            return new Promise((resolve, reject) => {
                const transaction = this.db!.transaction(STORE_NAME, 'readonly');
                const store = transaction.objectStore(STORE_NAME);
                const request = store.get(id);
                request.onsuccess = () => resolve(request.result || null);
                request.onerror = () => reject(request.error);
            });
        } catch (e) {
            console.error("IndexedDB getBookById error:", e);
            return null;
        }
    }

    async saveBooks(books: Book[]): Promise<void> {
        await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            books.forEach(book => store.put(book));
            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
        });
    }
}

export const bookDb = new BookDatabase();
