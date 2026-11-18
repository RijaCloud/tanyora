export type StoreValue = string | number | boolean | object | null;

export type CacheSetEntry = {
  key: string;
  value: StoreValue;
  ttlSeconds?: number;
};

export interface KeyValueStore {
  get<T = StoreValue>(key: string): Promise<T | null>;
  getMany<T = StoreValue>(keys: string[]): Promise<Array<T | null>>;
  set<T = StoreValue>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  setMany(entries: CacheSetEntry[]): Promise<void>;
  delete(key: string): Promise<void>;
  deleteMany(keys: string[]): Promise<void>;
  increment(key: string, ttlSeconds?: number): Promise<number>;
}
