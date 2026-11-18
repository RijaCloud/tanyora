import type { CacheSetEntry, KeyValueStore } from "@/lib/cache/store";

type MemoryEntry = {
  value: unknown;
  expiresAt?: number;
};

export class LocalMemoryStore implements KeyValueStore {
  private map = new Map<string, MemoryEntry>();

  async get<T = unknown>(key: string): Promise<T | null> {
    const entry = this.map.get(key);
    if (!entry) return null;

    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.map.delete(key);
      return null;
    }

    return entry.value as T;
  }

  async getMany<T = unknown>(keys: string[]): Promise<Array<T | null>> {
    return Promise.all(keys.map((key) => this.get<T>(key)));
  }

  async set<T = unknown>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined;
    this.map.set(key, { value, expiresAt });
  }

  async setMany(entries: CacheSetEntry[]): Promise<void> {
    await Promise.all(entries.map((entry) => this.set(entry.key, entry.value, entry.ttlSeconds)));
  }

  async delete(key: string): Promise<void> {
    this.map.delete(key);
  }

  async deleteMany(keys: string[]): Promise<void> {
    keys.forEach((key) => this.map.delete(key));
  }

  async increment(key: string, ttlSeconds?: number): Promise<number> {
    const current = Number((await this.get<number>(key)) ?? 0) + 1;
    await this.set<number>(key, current, ttlSeconds);
    return current;
  }
}
