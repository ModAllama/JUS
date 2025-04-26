import Redis from 'ioredis';
import dotenv from 'dotenv';
import { logger } from './common.js';

dotenv.config();

class RedisCache {
    constructor() {
        this.client = null;
        this.connect();
    }

    connect() {
        try {
            let redisConfig = {
                keyPrefix: 'upgenie:',
                retryStrategy: this.retryStrategy,
                maxRetriesPerRequest: 3,
                enableReadyCheck: true,
                reconnectOnError: (err) => {
                    const targetError = 'READONLY';
                    if (err.message.includes(targetError)) {
                        return true;
                    }
                    return false;
                }
            };

            // Log environment variables (without sensitive data)
            logger.info('Redis connection details:');
            logger.info(`- Host: ${process.env.REDIS_HOST || 'Not set'}`);
            logger.info(`- Port: ${process.env.REDIS_PORT || 'Not set'}`);
            logger.info(`- Username: ${process.env.REDIS_USERNAME || 'Not set'}`);
            logger.info(`- REDIS_URL set: ${!!process.env.REDIS_URL}`);

            // Parse REDIS_URL if available
            if (process.env.REDIS_URL) {
                try {
                    // Use the Redis URL directly with ioredis
                    this.client = new Redis(process.env.REDIS_URL, redisConfig);
                    logger.info('Using Redis URL for connection');
                } catch (error) {
                    logger.error('Failed to connect using REDIS_URL', error);
                    throw error;
                }
            } else {
                // Fallback to individual connection parameters
                redisConfig = {
                    ...redisConfig,
                    host: process.env.REDIS_HOST,
                    port: process.env.REDIS_PORT,
                    username: process.env.REDIS_USERNAME,
                    password: process.env.REDIS_PASSWORD
                };

                // Log connection attempt (without sensitive data)
                logger.info(`Attempting to connect to Redis at ${redisConfig.host}:${redisConfig.port}`);

                this.client = new Redis(redisConfig);
            }

            this.setupEventListeners();
        } catch (error) {
            logger.error('Failed to initialize Redis client', error);
            throw error;
        }
    }

    setupEventListeners() {
        this.client.on('error', (error) => {
            logger.error('Redis connection error', error);
            // Attempt to reconnect on error after a delay
            setTimeout(() => {
                logger.info('Attempting to reconnect to Redis...');
                this.connect();
            }, 5000);
        });

        this.client.on('connect', () => {
            logger.info('Redis connected successfully');
        });

        this.client.on('ready', () => {
            logger.info('Redis client ready');
        });

        this.client.on('reconnecting', () => {
            logger.info('Redis client reconnecting...');
        });

        this.client.on('end', () => {
            logger.info('Redis connection ended');
        });
    }

    retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
    }

    async set(key, value, ttl = 300) {
        try {
            if (!this.client) {
                throw new Error('Redis client not initialized');
            }

            if (ttl > 0) {
                await this.client.set(key, JSON.stringify(value), 'EX', ttl);
            } else {
                await this.client.set(key, JSON.stringify(value));
            }
            return true;
        } catch (error) {
            logger.error('Cache set error', error);
            return false;
        }
    }

    async get(key) {
        try {
            if (!this.client) {
                throw new Error('Redis client not initialized');
            }

            const data = await this.client.get(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            logger.error('Cache get error', error);
            return null;
        }
    }

    async del(key) {
        try {
            if (!this.client) {
                throw new Error('Redis client not initialized');
            }

            await this.client.del(key);
            return true;
        } catch (error) {
            logger.error('Cache delete error', error);
            return false;
        }
    }

    async keys(pattern) {
        try {
            if (!this.client) {
                throw new Error('Redis client not initialized');
            }

            // Remove prefix from pattern for searching
            const searchPattern = pattern.startsWith(this.client.options.keyPrefix) 
                ? pattern 
                : this.client.options.keyPrefix + pattern;
            
            const keys = await this.client.keys(searchPattern);
            
            // Remove prefix from returned keys
            return keys.map(key => 
                key.replace(this.client.options.keyPrefix, '')
            );
        } catch (error) {
            logger.error('Cache keys error', error);
            return [];
        }
    }

    async clear() {
        try {
            if (!this.client) {
                throw new Error('Redis client not initialized');
            }

            const keys = await this.keys('*');
            if (keys.length > 0) {
                await this.client.del(keys);
            }
            return true;
        } catch (error) {
            logger.error('Cache clear error', error);
            return false;
        }
    }

    async disconnect() {
        if (this.client) {
            await this.client.quit();
            this.client = null;
        }
    }
}

export const cache = new RedisCache();

// Specialized cache for AI analysis
export const aiCache = {
    async set(key, value) {
        return cache.set(`ai:${key}`, value);
    },

    async get(key) {
        return cache.get(`ai:${key}`);
    },

    async clear() {
        const keys = await cache.keys('ai:*');
        if (keys.length > 0) {
            await cache.del(keys);
        }
        return true;
    },

    async getActiveFeeds() {
        return cache.get('ai:active_feeds') || [];
    },

    async setActiveFeeds(feeds) {
        return cache.set('ai:active_feeds', feeds);
    }
};

// Feed cache management
export const feedCache = {
    async getActiveFeeds() {
        return cache.get('active_feeds');
    },
    async setActiveFeeds(feeds) {
        return cache.set('active_feeds', feeds, 300); // 5 min TTL
    }
}; 