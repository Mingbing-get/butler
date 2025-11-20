import { createLogger } from '@butler/utils';
export class Butler {
    config;
    logger;
    plugins = new Map();
    tasks = new Map();
    constructor(config) {
        this.config = config;
        this.logger = createLogger(config);
    }
    async initialize() {
        this.logger.info('Initializing Butler...');
        for (const [name, plugin] of this.plugins) {
            this.logger.info(`Initializing plugin: ${name}`);
            await plugin.initialize(this.config);
        }
        this.logger.info('Butler initialized successfully');
    }
    async destroy() {
        this.logger.info('Destroying Butler...');
        for (const [name, plugin] of this.plugins) {
            if (plugin.destroy) {
                this.logger.info(`Destroying plugin: ${name}`);
                await plugin.destroy();
            }
        }
        this.plugins.clear();
        this.tasks.clear();
        this.logger.info('Butler destroyed successfully');
    }
    registerPlugin(plugin) {
        if (this.plugins.has(plugin.name)) {
            throw new Error(`Plugin ${plugin.name} is already registered`);
        }
        this.plugins.set(plugin.name, plugin);
        this.logger.info(`Plugin ${plugin.name} registered`);
    }
    unregisterPlugin(name) {
        if (!this.plugins.has(name)) {
            throw new Error(`Plugin ${name} is not registered`);
        }
        this.plugins.delete(name);
        this.logger.info(`Plugin ${name} unregistered`);
    }
    createTask(name) {
        const task = {
            id: crypto.randomUUID(),
            name,
            status: 'pending',
            createdAt: new Date(),
            updatedAt: new Date()
        };
        this.tasks.set(task.id, task);
        this.logger.info(`Task created: ${task.name} (${task.id})`);
        return task;
    }
    getTask(id) {
        return this.tasks.get(id);
    }
    getAllTasks() {
        return Array.from(this.tasks.values());
    }
    updateTaskStatus(id, status) {
        const task = this.tasks.get(id);
        if (!task) {
            throw new Error(`Task ${id} not found`);
        }
        task.status = status;
        task.updatedAt = new Date();
        this.logger.info(`Task ${task.name} status updated to: ${status}`);
    }
    getConfig() {
        return { ...this.config };
    }
    getLogger() {
        return this.logger;
    }
}
//# sourceMappingURL=index.js.map