import type { CacheSetEntry, KeyValueStore } from "@/lib/cache/store";

type RedisLikeClient = {
  get(key: string): Promise<unknown>;
  getMany(keys: string[]): Promise<Array<unknown>>;
  set(key: string, value: string, opts?: { ex?: number }): Promise<unknown>;
  setMany(entries: Array<{ key: string; value: string; ex?: number }>): Promise<unknown>;
  del(key: string): Promise<number>;
  delMany(keys: string[]): Promise<number>;
  incr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<number>;
};

export class RedisStore implements KeyValueStore {
  constructor(
    private readonly client: RedisLikeClient,
    private readonly keyPrefix = "",
  ) {}

  private key(key: string) {
    return `${this.keyPrefix}${key}`;
  }

  private withTimeout<T>(promise: Promise<T>, operation: string): Promise<T> {
    const timeoutMs = Number(process.env.REDIS_OPERATION_TIMEOUT_MS ?? 1500);
    if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
      return promise;
    }

    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Redis ${operation} timed out after ${timeoutMs}ms.`));
      }, timeoutMs);

      promise.then(
        (value) => {
          clearTimeout(timer);
          resolve(value);
        },
        (error) => {
          clearTimeout(timer);
          reject(error);
        },
      );
    });
  }

  async get<T = unknown>(key: string): Promise<T | null> {
    const raw = await this.withTimeout(this.client.get(this.key(key)), "get");
    if (raw === null) return null;
    if (typeof raw === "string") {
      return JSON.parse(raw) as T;
    }
    return raw as T;
  }

  async getMany<T = unknown>(keys: string[]): Promise<Array<T | null>> {
    if (keys.length === 0) return [];
    const values = await this.withTimeout(this.client.getMany(keys.map((key) => this.key(key))), "getMany");
    return values.map((raw) => {
      if (raw === null) return null;
      if (typeof raw === "string") return JSON.parse(raw) as T;
      return raw as T;
    });
  }

  async set<T = unknown>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const payload = JSON.stringify(value);
    if (ttlSeconds && ttlSeconds > 0) {
      await this.withTimeout(this.client.set(this.key(key), payload, { ex: ttlSeconds }), "set");
      return;
    }
    await this.withTimeout(this.client.set(this.key(key), payload), "set");
  }

  async setMany(entries: CacheSetEntry[]): Promise<void> {
    if (entries.length === 0) return;
    await this.withTimeout(
      this.client.setMany(entries.map((entry) => ({
        key: this.key(entry.key),
        value: JSON.stringify(entry.value),
        ex: entry.ttlSeconds && entry.ttlSeconds > 0 ? entry.ttlSeconds : undefined,
      }))),
      "setMany",
    );
  }

  async delete(key: string): Promise<void> {
    await this.withTimeout(this.client.del(this.key(key)), "delete");
  }

  async deleteMany(keys: string[]): Promise<void> {
    if (keys.length === 0) return;
    await this.withTimeout(this.client.delMany(keys.map((key) => this.key(key))), "deleteMany");
  }

  async increment(key: string, ttlSeconds?: number): Promise<number> {
    const redisKey = this.key(key);
    const current = await this.withTimeout(this.client.incr(redisKey), "increment");
    if (ttlSeconds && ttlSeconds > 0 && current === 1) {
      await this.withTimeout(this.client.expire(redisKey, ttlSeconds), "expire");
    }
    return current;
  }
}
