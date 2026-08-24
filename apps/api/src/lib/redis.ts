import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379';

export const redis = new Redis(REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => Math.min(times * 50, 2000),
});

let isRedisAvailable = false;
const inMemoryCache = new Map<string, { value: string; expiry: number }>();

redis.on('error', (err) => {
  console.error('RAM error:', err.message);
  isRedisAvailable = false;
});

redis.on('connect', () => {
  console.log('RAM connected');
  isRedisAvailable = true;
});

// ─── Cache helpers ──────────────────────────────────────────

export async function getCache<T>(key: string): Promise<T | null> {
  let raw: string | null = null;
  
  if (isRedisAvailable) {
    try {
      raw = await redis.get(key);
    } catch {
      // fallback
    }
  }

  if (!raw && !isRedisAvailable) {
    const entry = inMemoryCache.get(key);
    if (entry && entry.expiry > Date.now()) {
      raw = entry.value;
    } else if (entry) {
      inMemoryCache.delete(key);
    }
  }

  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function setCache(key: string, value: unknown, ttlSeconds = 60): Promise<void> {
  const stringValue = JSON.stringify(value);
  if (isRedisAvailable) {
    try {
      await redis.set(key, stringValue, 'EX', ttlSeconds);
      return;
    } catch {
      // fallback
    }
  }
  
  inMemoryCache.set(key, { value: stringValue, expiry: Date.now() + ttlSeconds * 1000 });
}

export async function invalidateCache(pattern: string): Promise<void> {
  if (isRedisAvailable) {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) await redis.del(...keys);
      return;
    } catch {
      // fallback
    }
  }
  
  // In-memory fallback
  const regexPattern = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
  for (const key of inMemoryCache.keys()) {
    if (regexPattern.test(key)) {
      inMemoryCache.delete(key);
    }
  }
}
