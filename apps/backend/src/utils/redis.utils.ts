import crypto from 'crypto';

import { TemporaryServerError } from '@/utils/app-error.js';
import { getRedisClient } from '@/config/redis-config';
import { logger } from '@/config/logger-config';

const TAG_PREFIX = 'tag:';

/**
 * Creates a hashed Redis cache key from a prefix and dynamic parts.
 * @example
 * const key = createCacheKey('course:list', [filter, page]);
 */
export const createCacheKey = (prefix: string, parts: unknown[]): string => {
  const raw = JSON.stringify(parts);
  const hash = crypto.createHash('md5').update(raw).digest('hex');
  return `${prefix}:${hash}`;
};

/**
 * Get value from Redis cache.
 */
export const getCache = async (key: string): Promise<string | null> => {
  try {
    const redis = await getRedisClient();
    if (!redis) return null;
    const value = await redis.get(key);
    logger.debug(`Redis: GET → Key: ${key} | Hit: ${value !== null}`);
    return value;
  } catch (err) {
    logger.error(`Redis GET Error → ${key}`, err);
    throw new TemporaryServerError();
  }
};

/**
 * Set value in Redis with TTL and attach tags.
 */
export const setCache = async (
  key: string,
  value: string,
  EX: number,
  tags: string[] = []
): Promise<void> => {
  try {
    const redis = await getRedisClient();
    if (!redis) return null;
    await redis.set(key, value, 'EX', EX);
    logger.debug(
      `Redis: SET → Key: ${key} | TTL: ${EX}s | Tags: [${tags.join(', ')}]`
    );

    for (const tag of tags) {
      const tagKey = `${TAG_PREFIX}${tag}`;
      await redis.sadd(tagKey, key);
    }
  } catch (err) {
    logger.error(`Redis SET Error → ${key}`, err);
    throw new TemporaryServerError();
  }
};

/**
 * Delete a cache key.
 */
export const deleteCache = async (key: string): Promise<void> => {
  try {
    const redis = await getRedisClient();
    if (!redis) return null;
    const result = await redis.del(key);
    logger.debug(
      result === 1 ? `Redis: DEL → ${key}` : `Redis: DEL skipped → ${key}`
    );
  } catch (err) {
    logger.error(`Redis DEL Error → ${key}`, err);
    throw new TemporaryServerError();
  }
};

/**
 * Check if a cache key exists.
 */
export const checkExists = async (key: string): Promise<boolean> => {
  try {
    const redis = await getRedisClient();
    if (!redis) return null;
    const exists = await redis.exists(key);
    logger.debug(`Redis: EXISTS → ${key} = ${!!exists}`);
    return !!exists;
  } catch (err) {
    logger.error(`Redis EXISTS Error → ${key}`, err);
    throw new TemporaryServerError();
  }
};

/**
 * Invalidate all cache keys associated with a given tag.
 */
export const invalidateTag = async (tag: string): Promise<void> => {
  try {
    const redis = await getRedisClient();
    if (!redis) return null;
    const tagKey = `${TAG_PREFIX}${tag}`;
    const keys = await redis.smembers(tagKey);

    if (keys.length > 0) {
      await redis.del(...keys);
      logger.debug(`Redis: DEL → ${keys.length} keys under tag ${tag}`);
    }

    await redis.del(tagKey); // delete the tag set itself
    logger.debug(`Redis: DEL Tag Set → ${tagKey}`);
  } catch (err) {
    logger.error(`Redis InvalidateTag Error → ${tag}`, err);
    throw new TemporaryServerError();
  }
};

/**
 * Invalidate multiple tags.
 */
export const invalidateTags = async (tags: string[]): Promise<void> => {
  for (const tag of tags) {
    await invalidateTag(tag);
  }
};

export const getOrSetCache = async <T>(
  key: string,
  EX: number,
  tags: string[],
  fallbackFn: () => Promise<T>
) => {
  const cached = await getCache(key);
  if (cached) {
    try {
      return JSON.parse(cached) as T;
    } catch {
      logger.warn(`Redis: Cache JSON parse failed → Key: ${key}`);
    }
  }

  const value = await fallbackFn();
  await setCache(key, JSON.stringify(value), EX, tags);
  return value;
};
