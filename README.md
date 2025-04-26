# JUS Upwork URL Scraper

This is a minimal, production-ready Upwork job URL scraper. It runs every 2 minutes, scrapes job URLs, and stores unique URLs in Redis with a 20-minute TTL.

## Setup

1. Copy `.env.example` to `.env` and fill in your Redis and (optionally) Chrome path settings.
2. Install dependencies:
   ```sh
   npm install
   ```
3. Run the scraper:
   ```sh
   npm start
   ```

## Docker
To build and run with Docker:
```sh
docker build -t jus-scraper .
docker run --env-file .env jus-scraper
```

## Environment Variables
See `.env.example` for all required variables.

## Notes
- Only unique URLs are stored in Redis under the key `urls`.
- Scraper is optimized for low resource usage.
- Logs are simple and production-friendly.
