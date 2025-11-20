import type { ButlerConfig, Logger } from '@butler/types';

export function createLogger(config: ButlerConfig): Logger {
  return {
    info: (message: string, ...args: unknown[]) => {
      console.log(`[${config.name}] INFO:`, message, ...args);
    },
    warn: (message: string, ...args: unknown[]) => {
      console.warn(`[${config.name}] WARN:`, message, ...args);
    },
    error: (message: string, ...args: unknown[]) => {
      console.error(`[${config.name}] ERROR:`, message, ...args);
    },
    debug: (message: string, ...args: unknown[]) => {
      if (config.environment === 'development') {
        console.debug(`[${config.name}] DEBUG:`, message, ...args);
      }
    }
  };
}

export function formatDate(date: Date): string {
  return date.toISOString();
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}