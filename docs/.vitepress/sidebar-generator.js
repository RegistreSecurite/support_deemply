import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Génère la configuration de la sidebar en scannant le dossier guide
 * @returns {Object[]} Configuration de la sidebar pour VitePress
 */
export function generateSidebar() {
  const guideDir = path.join(__dirname, '..', 'guide');
  const items = [];
  
  // Vérifier si le dossier guide existe
  if (!fs.existsSync(guideDir)) {
    console.warn('Le dossier guide n\'existe pas');
    return [
      {
        text: 'Guide',
        items: [
          { text: 'Introduction', link: '/guide/' }
        ]
      }
    ];
  }
  
  // Lire tous les fichiers du dossier guide
  const files = fs.readdirSync(guideDir);
  
  // Trier les fichiers (index.md en premier, puis par ordre alphabétique)
  files.sort((a, b) => {
    if (a === 'index.md') return -1;
    if (b === 'index.md') return 1;
    return a.localeCompare(b);
  });
  
  // Traiter chaque fichier
  for (const file of files) {
    // Ignorer les fichiers qui ne sont pas des fichiers markdown
    if (!file.endsWith('.md')) continue;
    
    // Lire le contenu du fichier pour extraire le titre
    const filePath = path.join(guideDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Extraire le titre du frontmatter ou de la première ligne # si disponible
    let title = '';
    const titleMatch = content.match(/^#\s+(.+)$/m) || content.match(/title:\s*["'](.+)["']/m);
    
    if (titleMatch && titleMatch[1]) {
      title = titleMatch[1];
    } else {
      // Utiliser le nom du fichier sans l'extension comme titre par défaut
      title = file === 'index.md' ? 'Introduction' : file.replace('.md', '');
      // Mettre la première lettre en majuscule
      title = title.charAt(0).toUpperCase() + title.slice(1);
    }
    
    // Construire le lien
    const link = `/guide/${file === 'index.md' ? '' : file.replace('.md', '')}`;
    
    // Ajouter à la liste des items
    items.push({ text: title, link });
  }
  
  // Retourner la configuration de la sidebar
  return [
    {
      text: 'Guide',
      items
    }
  ];
}
