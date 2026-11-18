import type { CacheSetEntry, KeyValueStore, StoreValue } from "@/lib/cache/store";

type ResilientStoreOptions = {
  name: string;
};

export class ResilientStore implements KeyValueStore {
  private hasWarned = false;
  private primaryDisabledUntil = 0;

  constructor(
    private readonly primary: KeyValueStore,
    private readonly fallback: KeyValueStore,
    private readonly options: ResilientStoreOptions,
  ) {}

  private warnOnce(error: unknown) {
    if (this.hasWarned) {
      return;
    }

    this.hasWarned = true;
    const detail = error instanceof Error ? error.message : String(error);
    console.warn(`[cache] ${this.options.name} indisponible, fallback memory active. Detail: ${detail}`);
  }

  private getCooldownMs() {
    const value = Number(process.env.CACHE_PRIMARY_COOLDOWN_MS ?? 60000);
    return Number.isFinite(value) && value > 0 ? value : 60000;
  }

  private shouldUseFallbackOnly() {
    return Date.now() < this.primaryDisabledUntil;
  }

  private disablePrimaryTemporarily(error: unknown) {
    this.primaryDisabledUntil = Date.now() + this.getCooldownMs();
    this.warnOnce(error);
  }

  async get<T = StoreValue>(key: string): Promise<T | null> {
    if (this.shouldUseFallbackOnly()) {
      return this.fallback.get<T>(key);
    }

    try {
      return await this.primary.get<T>(key);
    } catch (error) {
      this.disablePrimaryTemporarily(error);
      return this.fallback.get<T>(key);
    }
  }

  async getMany<T = StoreValue>(keys: string[]): Promise<Array<T | null>> {
    if (keys.length === 0) {
      return [];
    }

    if (this.shouldUseFallbackOnly()) {
      return this.fallback.getMany<T>(keys);
    }

    try {
      return await this.primary.getMany<T>(keys);
    } catch (error) {
      this.disablePrimaryTemporarily(error);
      return this.fallback.getMany<T>(keys);
    }
  }

  async set<T = StoreValue>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    await this.fallback.set<T>(key, value, ttlSeconds);

    if (this.shouldUseFallbackOnly()) {
      return;
    }

    try {
      await this.primary.set<T>(key, value, ttlSeconds);
    } catch (error) {
      this.disablePrimaryTemporarily(error);
    }
  }

  async setMany(entries: CacheSetEntry[]): Promise<void> {
    if (entries.length === 0) {
      return;
    }

    await this.fallback.setMany(entries);
    if (this.shouldUseFallbackOnly()) {
      return;
    }

    try {
      await this.primary.setMany(entries);
    } catch (error) {
      this.disablePrimaryTemporarily(error);
    }
  }

  async delete(key: string): Promise<void> {
    await this.fallback.delete(key);

    if (this.shouldUseFallbackOnly()) {
      return;
    }

    try {
      await this.primary.delete(key);
    } catch (error) {
      this.disablePrimaryTemporarily(error);
    }
  }

  async deleteMany(keys: string[]): Promise<void> {
    if (keys.length === 0) {
      return;
    }

    await this.fallback.deleteMany(keys);
    if (this.shouldUseFallbackOnly()) {
      return;
    }

    try {
      await this.primary.deleteMany(keys);
    } catch (error) {
      this.disablePrimaryTemporarily(error);
    }
  }

  async increment(key: string, ttlSeconds?: number): Promise<number> {
    if (this.shouldUseFallbackOnly()) {
      return this.fallback.increment(key, ttlSeconds);
    }

    try {
      const value = await this.primary.increment(key, ttlSeconds);
      await this.fallback.set<number>(key, value, ttlSeconds);
      return value;
    } catch (error) {
      this.disablePrimaryTemporarily(error);
      return this.fallback.increment(key, ttlSeconds);
    }
  }
}
