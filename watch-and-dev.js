import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Lancer VitePress
const vitepress = spawn('npx', ['vitepress', 'dev', 'docs'], {
  stdio: 'inherit',
  cwd: __dirname
});

// Lancer le script de surveillance
const watcher = spawn('node', ['./docs/.vitepress/watch-guide-standalone.js'], {
  stdio: 'inherit',
  cwd: __dirname
});

// Gérer l'arrêt propre
process.on('SIGINT', () => {
  console.log('Arrêt des processus...');
  vitepress.kill();
  watcher.kill();
  process.exit();
});
