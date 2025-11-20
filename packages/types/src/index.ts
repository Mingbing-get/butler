// Common types used across Butler packages

export interface ButlerConfig {
  name: string;
  version: string;
  environment: 'development' | 'production' | 'test';
}

export interface Logger {
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
  debug(message: string, ...args: unknown[]): void;
}

export interface Task {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}

export interface ButlerPlugin {
  name: string;
  version: string;
  initialize(config: ButlerConfig): Promise<void> | void;
  destroy?(): Promise<void> | void;
}