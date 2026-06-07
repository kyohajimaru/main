import { readdirSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

const root = process.cwd();
const ignored = new Set(['dist', 'node_modules', '.git', 'assets', 'scripts', 'src', 'public']);

function htmlInputs(dir = root, inputs = {}) {
  for (const name of readdirSync(dir)) {
    if (dir === root && ignored.has(name)) continue;
    const path = resolve(dir, name);
    const stat = statSync(path);
    if (stat.isDirectory()) {
      htmlInputs(path, inputs);
    } else if (name.endsWith('.html')) {
      const key = path.replace(root, '').replace(/^\/+/, '').replace(/\/index\.html$/, '') || 'index';
      inputs[key] = path;
    }
  }
  return inputs;
}

export default defineConfig({
  build: {
    rollupOptions: {
      input: htmlInputs(),
    },
  },
});
