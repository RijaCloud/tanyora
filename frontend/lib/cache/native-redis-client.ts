import { createClient } from "redis";

type NativeRedisOptions = {
  url: string;
  connectTimeoutMs: number;
};

/** Minimal adapter that keeps the cache layer independent from the Redis SDK. */
export class NativeRedisClient {
  private client: ReturnType<typeof createClient> | null = null;
  private connecting: Promise<void> | null = null;

  constructor(private readonly options: NativeRedisOptions) {}

  private async getClient() {
    if (this.client?.isReady) {
      return this.client;
    }

    if (this.client && !this.connecting) {
      // A failed socket must not be reused after ResilientStore's cooldown.
      void this.client.disconnect().catch(() => undefined);
      this.client = null;
    }

    if (!this.connecting) {
      const client = createClient({
        url: this.options.url,
        socket: {
          connectTimeout: this.options.connectTimeoutMs,
          reconnectStrategy: false,
        },
      });

      // Errors are returned to callers, where ResilientStore activates memory fallback.
      client.on("error", () => undefined);
      this.client = client;
      this.connecting = client.connect()
        .then(() => undefined)
        .catch((error) => {
          this.client = null;
          throw error;
        })
        .finally(() => {
          this.connecting = null;
        });
    }

    await this.connecting;
    if (!this.client?.isReady) {
      throw new Error("Redis connection is not ready.");
    }

    return this.client;
  }

  async get(key: string): Promise<string | null> {
    return (await this.getClient()).get(key);
  }

  async getMany(keys: string[]): Promise<Array<string | null>> {
    if (keys.length === 0) return [];
    return (await this.getClient()).mGet(keys);
  }

  async set(key: string, value: string, options?: { ex?: number }): Promise<void> {
    const client = await this.getClient();
    if (options?.ex) {
      await client.set(key, value, { EX: options.ex });
      return;
    }
    await client.set(key, value);
  }

  async setMany(entries: Array<{ key: string; value: string; ex?: number }>): Promise<void> {
    if (entries.length === 0) return;
    const transaction = (await this.getClient()).multi();
    entries.forEach((entry) => {
      if (entry.ex) {
        transaction.set(entry.key, entry.value, { EX: entry.ex });
      } else {
        transaction.set(entry.key, entry.value);
      }
    });
    await transaction.exec();
  }

  async del(key: string): Promise<number> {
    return (await this.getClient()).del(key);
  }

  async delMany(keys: string[]): Promise<number> {
    if (keys.length === 0) return 0;
    return (await this.getClient()).del(keys);
  }

  async incr(key: string): Promise<number> {
    return (await this.getClient()).incr(key);
  }

  async expire(key: string, seconds: number): Promise<number> {
    return (await (await this.getClient()).expire(key, seconds)) ? 1 : 0;
  }
}
