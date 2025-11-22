import { defineConfig } from 'vite';
import { vitePluginForArco } from '@arco-plugins/vite-react';

import createWebViteConfig from '../../../vite.web.config';

export default defineConfig(
  createWebViteConfig('WebToolArco', __dirname, [
    vitePluginForArco({ style: 'css' }),
  ])
);
