// Centralized logging utility
const isDevelopment = import.meta.env.DEV;

export const logger = {
  log: (message, ...args) => {
    if (isDevelopment) {
      console.log(message, ...args);
    }
  },
  
  warn: (message, ...args) => {
    if (isDevelopment) {
      console.warn(message, ...args);
    }
  },
  
  error: (message, ...args) => {
    // Always log errors, even in production
    console.error(message, ...args);
  },
  
  info: (message, ...args) => {
    if (isDevelopment) {
      console.info(message, ...args);
    }
  }
};

// Helper for conditional logging
export const devLog = (message, ...args) => {
  if (isDevelopment) {
    console.log(message, ...args);
  }
}; 