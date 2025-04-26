export const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Logging utility for consistent logging across the application
export const logger = {
  info: (message) => {
    console.log(`[JUS] ${message}`);
  },
  error: (message, error = null) => {
    if (error) {
      console.error(`[JUS] ${message}:`, error.message);
      if (error.stack) {
        console.error(`[JUS] Error details:`, error.stack);
      }
    } else {
      console.error(`[JUS] ${message}`);
    }
  },
  warn: (message) => {
    console.warn(`[JUS] ${message}`);
  },
  debug: (message) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[JUS-DEBUG] ${message}`);
    }
  },
  summary: (title, data) => {
    console.log(`
[JUS] ===== ${title} =====
${Object.entries(data).map(([key, value]) => `[JUS] ${key}: ${value}`).join('\n')}
[JUS] ====================
    `);
  }
};
