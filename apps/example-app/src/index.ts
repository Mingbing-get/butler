import { Butler } from '@butler/core';
import type { ButlerPlugin } from '@butler/types';

// 示例插件
class LoggerPlugin implements ButlerPlugin {
  name = 'logger-plugin';
  version = '1.0.0';

  async initialize() {
    console.log('Logger plugin initialized');
  }

  async destroy() {
    console.log('Logger plugin destroyed');
  }
}

// 示例任务插件
class TaskPlugin implements ButlerPlugin {
  name = 'task-plugin';
  version = '1.0.0';

  async initialize() {
    console.log('Task plugin initialized');
  }

  async destroy() {
    console.log('Task plugin destroyed');
  }
}

async function main() {
  // 创建 Butler 实例
  const butler = new Butler({
    name: 'example-app',
    version: '1.0.0',
    environment: 'development'
  });

  try {
    // 注册插件
    butler.registerPlugin(new LoggerPlugin());
    butler.registerPlugin(new TaskPlugin());

    // 初始化
    await butler.initialize();

    // 创建一些任务
    const task1 = butler.createTask('Setup database');
    const task2 = butler.createTask('Run migrations');
    const task3 = butler.createTask('Start server');

    // 更新任务状态
    butler.updateTaskStatus(task1.id, 'running');
    setTimeout(() => {
      butler.updateTaskStatus(task1.id, 'completed');
    }, 1000);

    butler.updateTaskStatus(task2.id, 'running');
    setTimeout(() => {
      butler.updateTaskStatus(task2.id, 'completed');
    }, 2000);

    butler.updateTaskStatus(task3.id, 'running');
    setTimeout(() => {
      butler.updateTaskStatus(task3.id, 'completed');
    }, 3000);

    // 显示所有任务
    console.log('\nAll tasks:');
    butler.getAllTasks().forEach(task => {
      console.log(`- ${task.name}: ${task.status}`);
    });

    // 等待所有任务完成
    await new Promise(resolve => setTimeout(resolve, 4000));

    console.log('\nFinal task status:');
    butler.getAllTasks().forEach(task => {
      console.log(`- ${task.name}: ${task.status}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    // 清理
    await butler.destroy();
  }
}

main().catch(console.error);