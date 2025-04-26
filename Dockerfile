# Use official Node.js image
FROM node:20-slim

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json first for better cache
COPY package*.json ./

# Install dependencies (only production)
RUN npm install --omit=dev

# Copy application code
COPY . .

# Expose port for fly.io
EXPOSE 8080

# Set environment variables (override in deployment)
ENV NODE_ENV=production
ENV PORT=8080

# Start the scraper
CMD ["node", "index.js"]
