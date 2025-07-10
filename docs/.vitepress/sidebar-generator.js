import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Génère la configuration de la sidebar en scannant le dossier guide
 * @returns {Array} Configuration de la sidebar
 */
export function generateSidebar() {
  const guideDir = path.join(__dirname, '..', 'guide');
  const sidebar = [];
  
  // Vérifier si le dossier guide existe
  if (!fs.existsSync(guideDir)) {
    console.warn('Le dossier guide n\'existe pas');
    return [];
  }
  
  // Récupérer tous les fichiers .md dans le dossier guide
  const files = getMarkdownFiles(guideDir);
  
  // Trier les fichiers par nom
  files.sort((a, b) => {
    // Mettre index.md en premier
    if (path.basename(a) === 'index.md') return -1;
    if (path.basename(b) === 'index.md') return 1;
    return a.localeCompare(b);
  });
  
  // Créer les items de la sidebar
  const items = files.map(file => {
    const relativePath = path.relative(path.join(__dirname, '..'), file).replace(/\\/g, '/');
    const fileContent = fs.readFileSync(file, 'utf-8');
    
    // Extraire le titre du fichier Markdown (première ligne commençant par #)
    const titleMatch = fileContent.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1] : path.basename(file, '.md');
    
    // Convertir le chemin relatif en lien
    const link = '/' + relativePath.replace(/\.md$/, '');
    
    return { text: title, link };
  });
  
  // Ajouter la section Guide à la sidebar
  if (items.length > 0) {
    sidebar.push({
      text: 'Guide',
      items
    });
  }
  
  return sidebar;
}

/**
 * Récupère récursivement tous les fichiers Markdown dans un dossier
 * @param {string} dir - Chemin du dossier à scanner
 * @returns {Array} Liste des chemins des fichiers Markdown
 */
function getMarkdownFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat && stat.isDirectory()) {
      // Récursion pour les sous-dossiers
      results = results.concat(getMarkdownFiles(filePath));
    } else if (path.extname(file) === '.md') {
      // Ajouter les fichiers .md
      results.push(filePath);
    }
  });
  
  return results;
}
