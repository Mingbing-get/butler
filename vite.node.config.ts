import { resolve } from 'path';
import { UserConfig } from 'vite';
import dts from 'vite-plugin-dts';
// @ts-ignore 无法解析类型声明，但运行时可用
import nodeExternals from 'vite-plugin-node-externals';

export default function createNodeViteConfig(
  name: string,
  outDir: string
): UserConfig {
  return {
    plugins: [
      dts({
        entryRoot: './src',
        outDir: resolve(outDir, 'dist', 'types'),
      }),
      nodeExternals(),
    ],
    build: {
      target: 'esnext',
      lib: {
        entry: './src/index.ts',
        name,
        fileName: 'index',
      },
      rollupOptions: {
        external: [
          '@butler/*',
          'node:fs',
          'node:path',
          'node:crypto',
          'node:url',
          'node:util',
          'node:os',
          'node:net',
          'node:http',
          'node:https',
          'node:events',
          'node:child_process',
          'node:buffer',
          'node:stream',
          'node:worker_threads',
        ],
        output: [
          {
            format: 'es',
            entryFileNames: '[name].mjs',
            preserveModules: true, // 保留原始文件结构
            exports: 'named',
            dir: resolve(outDir, 'dist', 'es'), // 输出到 'es' 目录
            preserveModulesRoot: 'src',
          },
          {
            format: 'cjs',
            entryFileNames: '[name].cjs',
            preserveModules: true,
            exports: 'named',
            dir: resolve(outDir, 'dist', 'cjs'), // 输出到 'cjs' 目录
            preserveModulesRoot: 'src',
          },
        ],
      },
    },
  };
}
