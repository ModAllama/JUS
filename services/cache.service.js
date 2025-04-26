import Redis from 'ioredis';
import { config } from '../config.js';

export class CacheService {
  constructor() {
    // Debug: Log connection attempt
    console.log('[JUS] Attempting to connect to Redis...');
    
    // Use Redis URL if available, otherwise use individual connection parameters
    const redisConfig = process.env.REDIS_URL 
      ? { url: process.env.REDIS_URL }
      : {
          host: config.redis.host,
          port: config.redis.port,
          username: config.redis.username,
          password: config.redis.password,
          db: config.redis.db,
        };
    
    // Debug: Log connection config (without sensitive info)
    console.log('[JUS] Redis connection config:', {
      ...redisConfig,
      password: redisConfig.password ? '******' : 'not set'
    });
    
    this.client = new Redis(redisConfig);

    this.client.on('error', (err) => {
      console.error('[JUS] Redis error:', err);
      console.error('[JUS] Redis connection details:', {
        host: config.redis.host,
        port: config.redis.port,
        username: config.redis.username,
        db: config.redis.db
      });
    });

    this.client.on('connect', () => {
      console.log('[JUS] Redis connected successfully');
    });
    
    this.client.on('ready', () => {
      console.log('[JUS] Redis client ready');
    });
    
    this.client.on('close', () => {
      console.log('[JUS] Redis connection closed');
    });
    
    this.client.on('reconnecting', () => {
      console.log('[JUS] Redis reconnecting...');
    });
  }

  async get(key) {
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`[JUS] Error getting key ${key}:`, error);
      return null;
    }
  }

  async set(key, value, ttl = null) {
    try {
      const stringValue = JSON.stringify(value);
      if (ttl) {
        await this.client.setex(key, ttl, stringValue);
      } else {
        await this.client.set(key, stringValue);
      }
      return true;
    } catch (error) {
      console.error(`[JUS] Error setting key ${key}:`, error);
      return false;
    }
  }

  async delete(key) {
    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      console.error(`[JUS] Error deleting key ${key}:`, error);
      return false;
    }
  }

  async exists(key) {
    try {
      return await this.client.exists(key);
    } catch (error) {
      console.error(`[JUS] Error checking key ${key}:`, error);
      return false;
    }
  }

  async clear() {
    try {
      await this.client.flushdb();
      return true;
    } catch (error) {
      console.error('[JUS] Error clearing cache:', error);
      return false;
    }
  }

  async disconnect() {
    try {
      await this.client.quit();
      console.log('[JUS] Redis disconnected successfully');
    } catch (error) {
      console.error('[JUS] Error disconnecting Redis:', error);
    }
  }
} 