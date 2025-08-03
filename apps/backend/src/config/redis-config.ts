import { Redis } from 'ioredis';

import { config } from './env-config';
import { logger } from './logger-config';

let redisClient: Redis | null = null;

/**
 * Get a singleton Redis client.
 *
 * Uses the Redis URL from env config.
 * Logs connect and error events.
 * Throws if config is missing.
 *
 * @returns Connected Redis instance.
 * @throws `Internal Server Error` if missing redis url
 */
export const getRedisClient = async (): Promise<Redis | null> => {
  if (!config.redisUrl) {
    logger.warn('⚠️ REDIS_URL is missing — Redis will be disabled');
    return null;
  }

  if (!redisClient) {
    try {
      redisClient = new Redis(config.redisUrl);

      redisClient.on('connect', () => {
        logger.info('✅ Connected to Redis');
      });

      redisClient.on('error', err => {
        logger.error('❌ Redis connection error:', err);
      });

      // Optional: wait for connection
      await redisClient.ping();
    } catch (err) {
      logger.warn('⚠️ Redis initialization failed — disabling Redis.', err);
      redisClient = null;
    }
  }

  return redisClient;
};
