import Redis from 'ioredis';
import { loadConfig } from '@filevault360/config';

const config = loadConfig();

export const redisClient = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password || undefined,
  tls: config.redis.tls ? {} : undefined,
  lazyConnect: true,
  retryStrategy: (times) => {
    if (times > 3) return null;
    return Math.min(times * 200, 2000);
  },
});

redisClient.on('error', (err) => {
  console.warn('Redis connection error (non-fatal):', err.message);
});

redisClient.on('connect', () => {
  console.log('Connected to Redis');
});

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const value = await redisClient.get(key);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds = 300): Promise<void> {
  try {
    await redisClient.setex(key, ttlSeconds, JSON.stringify(value));
  } catch (err) {
    console.warn('Redis cache set failed:', err);
  }
}

export async function cacheDel(key: string): Promise<void> {
  try {
    await redisClient.del(key);
  } catch (err) {
    console.warn('Redis cache del failed:', err);
  }
}
