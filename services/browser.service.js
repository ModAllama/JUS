import { connect } from 'puppeteer-real-browser';
import { config } from '../config.js';
import { logger } from '../utils/common.js';

export class BrowserService {
  constructor() {
    this.browser = null;
    this.page = null;
  }

  async initialize() {
    try {
      logger.info('Initializing browser...');
      const { browser, page } = await connect({
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          // '--headless=new', // Commented out for debugging
        ],
        headless: true, // Set to false for debugging
        connectOption: {
          defaultViewport: config.browser.viewport,
          timeout: config.browser.timeout
        }
      });

      this.browser = browser;
      this.page = page;
      await this.page.setUserAgent(config.browser.userAgent);
      
      // Add console logging from the page
      this.page.on('console', msg => {
        const type = msg.type();
        if (type === 'error') {
          logger.error(`Browser Console Error: ${msg.text()}`);
        }
      });
      
      // Add error logging from the page
      this.page.on('pageerror', error => {
        logger.error('Browser Error', error);
      });
      
      logger.info('Browser initialized successfully');
      return true;
    } catch (error) {
      logger.error('Browser initialization failed', error);
      return false;
    }
  }

  async navigateTo(url) {
    try {
      logger.info(`Navigating to: ${url}`);
      await this.page.goto(url, { waitUntil: ['domcontentloaded'], timeout: 30000 });
      return true;
    } catch (error) {
      logger.error('Navigation failed', error);
      return false;
    }
  }

  async extractJobUrls() {
    try {
      logger.info('Extracting job URLs from page');
      const urls = await this.page.evaluate(() => {
        const links = document.querySelectorAll('a[href*="/jobs/"]');
        return Array.from(links)
          .map(link => link.href)
          .filter(url => url.includes('/jobs/') && !url.includes('/nx/search/jobs/') && !url.endsWith('/jobs/'));
      });
      return urls;
    } catch (error) {
      logger.error('URL extraction failed', error);
      return [];
    }
  }

  async close() {
    if (this.browser) {
      try {
        logger.info('Closing browser');
        await this.browser.disconnect();
        this.browser = null;
        this.page = null;
        return true;
      } catch (error) {
        logger.error('Browser close failed', error);
        return false;
      }
    }
    return true;
  }
} 