import dotenv from 'dotenv';
dotenv.config();

export const config = {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    username: process.env.REDIS_USERNAME || '',
    password: process.env.REDIS_PASSWORD || '',
    db: parseInt(process.env.REDIS_DB) || 0,
  },
  browser: {
    chromePath: process.env.CHROME_PATH,
    userAgent: process.env.USER_AGENT,
    viewport: { width: 1280, height: 800 },
    timeout: 20000,
  },
  scraper: {
    baseUrl: process.env.BASE_URL,
    redisKey: process.env.REDIS_KEY,
    redisTtl: parseInt(process.env.REDIS_TTL),
    scrapeInterval: 2 * 60 * 1000, // 2 minutes in milliseconds
    maxPages: 1, // Only scrape page 1
  },
}; 