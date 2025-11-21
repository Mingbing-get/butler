import { defineConfig } from 'vite';

import createNodeViteConfig from '../../vite.node.config';

export default defineConfig(
  createNodeViteConfig('ServerToolDatabase', __dirname)
);
