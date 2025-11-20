import type { ButlerConfig, ButlerPlugin, Task, Logger } from '@butler/types';
export declare class Butler {
    private config;
    private logger;
    private plugins;
    private tasks;
    constructor(config: ButlerConfig);
    initialize(): Promise<void>;
    destroy(): Promise<void>;
    registerPlugin(plugin: ButlerPlugin): void;
    unregisterPlugin(name: string): void;
    createTask(name: string): Task;
    getTask(id: string): Task | undefined;
    getAllTasks(): Task[];
    updateTaskStatus(id: string, status: Task['status']): void;
    getConfig(): ButlerConfig;
    getLogger(): Logger;
}
//# sourceMappingURL=index.d.ts.map