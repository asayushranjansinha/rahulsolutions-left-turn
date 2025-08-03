import { Redis } from 'ioredis';

import { InternalServerError } from '@/utils/app-error.js';
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
export const getRedisClient = async (): Promise<Redis> => {
  if (!config.redisUrl) {
    throw new InternalServerError(
      'REDIS_URL is not defined in the environment variables.'
    );
  }

  if (!redisClient) {
    redisClient = new Redis(config.redisUrl);

    redisClient.on('connect', () => {
      logger.info('✅ Connected to Redis');
    });

    redisClient.on('error', err => {
      logger.error('❌ Redis connection error:', err);
    });
  }
  return redisClient;
};
