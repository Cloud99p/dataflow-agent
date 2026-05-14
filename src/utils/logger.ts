export const logger = {
  info: (...args: any[]) => {
    console.log(`[${new Date().toISOString()}] ℹ️ `, ...args);
  },
  
  warn: (...args: any[]) => {
    console.warn(`[${new Date().toISOString()}] ⚠️ `, ...args);
  },
  
  error: (...args: any[]) => {
    console.error(`[${new Date().toISOString()}] ❌ `, ...args);
  },
  
  success: (...args: any[]) => {
    console.log(`[${new Date().toISOString()}] ✅ `, ...args);
  },
  
  debug: (...args: any[]) => {
    if (process.env.DEBUG === 'true') {
      console.log(`[${new Date().toISOString()}] 🔍 `, ...args);
    }
  }
};
