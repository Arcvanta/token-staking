import Redis, { RedisOptions } from 'ioredis';
import logger from '../utils/logger';
import { env } from './env';

const redisUrl = env('REDIS_URL', 'redis://127.0.0.1:6379');

export function getRedisConnectionOptions(): RedisOptions {
  try {
    const parsed = new URL(redisUrl);

    return {
      host: parsed.hostname,
      port: parsed.port ? Number(parsed.port) : 6379,
      username: parsed.username || undefined,
      password: parsed.password || undefined,
      tls: parsed.protocol === 'rediss:' ? {} : undefined,
      maxRetriesPerRequest: null,
      lazyConnect: true,
      enableOfflineQueue: false,
    };
  } catch {
    logger.warn(`Invalid REDIS_URL "${redisUrl}", falling back to localhost:6379`, {
      service: 'Redis',
    });

    return {
      host: '127.0.0.1',
      port: 6379,
      maxRetriesPerRequest: null,
      lazyConnect: true,
      enableOfflineQueue: false,
    };
  }
}

export const bullMQConnection = getRedisConnectionOptions();

let redisClient: Redis | null = null;

export function getRedisClient(): Redis {
  if (!redisClient) {
    redisClient = new Redis({
      ...getRedisConnectionOptions(),
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      retryStrategy(times) {
        return Math.min(times * 50, 2000);
      },
    });

    redisClient.on('connect', () => {
      logger.success('Connected to Redis', { service: 'Redis' });
    });

    redisClient.on('error', (err) => {
      logger.warn(`Redis error: ${err.message}`, { service: 'Redis' });
    });
  }

  return redisClient;
}

export async function isRedisAvailable(): Promise<boolean> {
  const client = new Redis({
    ...getRedisConnectionOptions(),
    maxRetriesPerRequest: 1,
    retryStrategy: () => null,
    lazyConnect: true,
    enableOfflineQueue: false,
  });

  client.on('error', () => {});

  try {
    await client.connect();
    await client.ping();
    await client.quit();
    return true;
  } catch {
    try {
      await client.quit();
    } catch {
      // Ignore cleanup errors for probe clients.
    }
    return false;
  }
}

export default getRedisClient;
