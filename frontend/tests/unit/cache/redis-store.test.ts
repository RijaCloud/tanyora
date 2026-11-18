import { describe, expect, it } from "vitest";
import { RedisStore } from "@/lib/cache/redis-store";

class FakeRedisClient {
  readonly values = new Map<string, string>();
  readonly expires = new Map<string, number>();

  async get(key: string) {
    return this.values.get(key) ?? null;
  }

  async getMany(keys: string[]) {
    return Promise.all(keys.map((key) => this.get(key)));
  }

  async set(key: string, value: string, options?: { ex?: number }) {
    this.values.set(key, value);
    if (options?.ex) this.expires.set(key, options.ex);
  }

  async setMany(entries: Array<{ key: string; value: string; ex?: number }>) {
    await Promise.all(entries.map((entry) => this.set(entry.key, entry.value, { ex: entry.ex })));
  }

  async del(key: string) {
    return this.values.delete(key) ? 1 : 0;
  }

  async delMany(keys: string[]) {
    const results = await Promise.all(keys.map((key) => this.del(key)));
    return results.reduce<number>((total, value) => total + value, 0);
  }

  async incr(key: string) {
    const next = Number(this.values.get(key) ?? "0") + 1;
    this.values.set(key, String(next));
    return next;
  }

  async expire(key: string, seconds: number) {
    if (!this.values.has(key)) return 0;
    this.expires.set(key, seconds);
    return 1;
  }
}

describe("RedisStore", () => {
  it("prefixes and pipelines grouped cache operations", async () => {
    const client = new FakeRedisClient();
    const store = new RedisStore(client, "2424:develop:next:");

    await store.setMany([
      { key: "first", value: { title: "Premier" }, ttlSeconds: 60 },
      { key: "second", value: [1, 2, 3] },
    ]);

    expect(client.values.get("2424:develop:next:first")).toBe('{"title":"Premier"}');
    expect(client.expires.get("2424:develop:next:first")).toBe(60);
    expect(await store.getMany(["first", "second"])).toEqual([{ title: "Premier" }, [1, 2, 3]]);

    await store.deleteMany(["first", "second"]);
    expect(client.values.size).toBe(0);
  });
});
