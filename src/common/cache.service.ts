import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class CacheService implements OnModuleDestroy {
  private readonly redis?: Redis;
  private readonly prefix = process.env.CACHE_PREFIX ?? 'alphaschool';
  private readonly enabled = process.env.CACHE_ENABLED !== 'false';

  constructor() {
    const redisUrl = process.env.REDIS_URL?.trim();
    if (this.enabled && redisUrl) {
      this.redis = new Redis(redisUrl, {
        enableOfflineQueue: false,
        maxRetriesPerRequest: 1,
        connectTimeout: 1000,
        commandTimeout: 500,
        lazyConnect: true,
        retryStrategy: () => null,
      });
      this.redis.on('error', () => undefined);
    }
  }

  async getOrSet<T>(
    key: string,
    ttlSeconds: number,
    loader: () => Promise<T>,
  ): Promise<T> {
    if (!this.redis) return loader();

    const cacheKey = this.key(key);
    try {
      const cached = await this.redis.get(cacheKey);
      if (cached) return JSON.parse(cached) as T;
    } catch {
      return loader();
    }

    const value = await loader();
    try {
      await this.redis.set(cacheKey, JSON.stringify(value), 'EX', ttlSeconds);
    } catch {
      // Cache failures should never break API responses.
    }
    return value;
  }

  async del(key: string): Promise<void> {
    if (!this.redis) return;
    try {
      await this.redis.del(this.key(key));
    } catch {
      // no-op
    }
  }

  async delPattern(pattern: string): Promise<void> {
    if (!this.redis) return;
    try {
      const stream = this.redis.scanStream({
        match: this.key(pattern),
        count: 100,
      });
      for await (const keys of stream) {
        const batch = keys as string[];
        if (batch.length) await this.redis.del(...batch);
      }
    } catch {
      // no-op
    }
  }

  async onModuleDestroy() {
    if (this.redis) this.redis.disconnect();
  }

  private key(key: string): string {
    return `${this.prefix}:${key}`;
  }
}
