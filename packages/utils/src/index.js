export function createLogger(config) {
    return {
        info: (message, ...args) => {
            console.log(`[${config.name}] INFO:`, message, ...args);
        },
        warn: (message, ...args) => {
            console.warn(`[${config.name}] WARN:`, message, ...args);
        },
        error: (message, ...args) => {
            console.error(`[${config.name}] ERROR:`, message, ...args);
        },
        debug: (message, ...args) => {
            if (config.environment === 'development') {
                console.debug(`[${config.name}] DEBUG:`, message, ...args);
            }
        }
    };
}
export function formatDate(date) {
    return date.toISOString();
}
export function debounce(func, wait) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}
//# sourceMappingURL=index.js.map