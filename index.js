import { ScraperService } from './services/scraper.service.js';
import process from 'process';
import { logger } from './utils/common.js';
import http from 'http';

let scraper;

// Create a simple HTTP server for health checks
const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

// Start the HTTP server
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  logger.info(`Health check server listening on port ${PORT}`);
});

async function startScraper() {
  try {
    logger.info('Starting Upwork job URL scraper...');
    
    if (process.env.JUS_RUN !== 'false') {
      scraper = new ScraperService();
      logger.info('Scraper starting...');
      await scraper.start();
    } else {
      logger.info('Scraper disabled by environment variable');
    }
  } catch (error) {
    logger.error('Failed to start scraper', error);
    process.exit(1);
  }
}

async function shutdown() {
  logger.info('Shutting down...');
  try {
    if (scraper) {
      await scraper.stop();
      logger.info('Scraper stopped successfully');
    }
    
    // Close the HTTP server
    server.close(() => {
      logger.info('HTTP server closed');
    });
  } catch (error) {
    logger.error('Error during shutdown', error);
  } finally {
    process.exit(0);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', error);
  shutdown();
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection at:', reason);
});

startScraper();
