import chokidar from 'chokidar';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Chemin vers le dossier guide
const guideDir = path.join(__dirname, '..', 'guide');

// Créer le dossier guide s'il n'existe pas
if (!fs.existsSync(guideDir)) {
  fs.mkdirSync(guideDir, { recursive: true });
  console.log('Dossier guide créé');
}

// Surveiller les changements dans le dossier guide
const watcher = chokidar.watch(guideDir, {
  persistent: true,
  ignoreInitial: false,
  awaitWriteFinish: {
    stabilityThreshold: 300,
    pollInterval: 100
  }
});

console.log(`Surveillance du dossier guide: ${guideDir}`);

// Événements de changement
watcher
  .on('add', path => {
    if (path.endsWith('.md')) {
      console.log(`Nouveau fichier détecté: ${path}`);
      console.log('La sidebar sera mise à jour au prochain rechargement');
    }
  })
  .on('unlink', path => {
    if (path.endsWith('.md')) {
      console.log(`Fichier supprimé: ${path}`);
      console.log('La sidebar sera mise à jour au prochain rechargement');
    }
  });

// Gérer l'arrêt propre
process.on('SIGINT', () => {
  watcher.close();
  process.exit();
});
