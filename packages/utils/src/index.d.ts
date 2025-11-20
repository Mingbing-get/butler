import type { ButlerConfig, Logger } from '@butler/types';
export declare function createLogger(config: ButlerConfig): Logger;
export declare function formatDate(date: Date): string;
export declare function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void;
//# sourceMappingURL=index.d.ts.map