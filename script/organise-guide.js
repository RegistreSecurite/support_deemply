import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Dossier source où Decap CMS crée les fichiers temporaires
const sourceDir = path.join(__dirname, '..', 'docs', 'guide');

// Dossier de destination pour les guides
const destinationBase = path.join(__dirname, '..', 'docs', 'guide');

// Fonction pour chercher récursivement les fichiers .md dans tous les sous-dossiers
function findMarkdownFiles(dir, files = []) {
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      // Chercher récursivement dans les sous-dossiers
      findMarkdownFiles(fullPath, files);
    } else if (item.endsWith('.md') && item !== 'index.md') {
      // Ajouter le fichier avec son chemin relatif
      const relativePath = path.relative(sourceDir, fullPath);
      files.push({
        name: item,
        fullPath: fullPath,
        relativePath: relativePath,
        directory: path.dirname(fullPath)
      });
    }
  }
  
  return files;
}

// Vérifier si le dossier source existe
if (!fs.existsSync(sourceDir)) {
  console.log('Dossier source non trouvé:', sourceDir);
  process.exit(0);
}

// Chercher tous les fichiers .md dans docs/guide et ses sous-dossiers
const fichiers = findMarkdownFiles(sourceDir);

if (fichiers.length === 0) {
  console.log('Aucun guide détecté.');
  process.exit(0);
}

for (const fichier of fichiers) {
  console.log(`🔍 Fichier trouvé: ${fichier.relativePath}`);
  
  // Lire le contenu du fichier pour déterminer la catégorie
  const contenu = fs.readFileSync(fichier.fullPath, 'utf8');
  const frontmatterMatch = contenu.match(/^---\s*\n([\s\S]*?)\n---/);
  
  let destinationDir = destinationBase;
  let finalFileName = fichier.name;
  
  if (frontmatterMatch) {
    const frontmatter = frontmatterMatch[1];
    
    // Extraire le champ folder
    const folderMatch = frontmatter.match(/folder:\s*["']?([^"'\n]+)["']?/);
    // Extraire le titre
    const titleMatch = frontmatter.match(/title:\s*["']?([^"'\n]+)["']?/);
    
    console.log(`📁 Folder détecté: ${folderMatch ? folderMatch[1] : 'aucun'}`);
    console.log(`📝 Titre détecté: ${titleMatch ? titleMatch[1] : 'aucun'}`);
    
    if (folderMatch && titleMatch) {
      const folderPath = folderMatch[1].trim();
      const title = titleMatch[1].trim();
      
      // Construire le chemin de destination basé sur le folder
      destinationDir = path.join(destinationBase, folderPath, title);
      // Renommer le fichier en index.md pour qu'il soit la page principale du dossier
      finalFileName = 'index.md';
    } else if (folderMatch) {
      // Si on a seulement le folder, utiliser le folder path
      const folderPath = folderMatch[1].trim();
      destinationDir = path.join(destinationBase, folderPath);
    }
  }
  
  const destinationPath = path.join(destinationDir, finalFileName);
  
  // Vérifier si le fichier est déjà à la bonne place
  if (fichier.fullPath === destinationPath) {
    console.log(`ℹ️ ${fichier.name} est déjà à la bonne place`);
    continue;
  }
  
  // Créer le dossier de destination s'il n'existe pas
  fs.mkdirSync(destinationDir, { recursive: true });
  
  // Déplacer le fichier
  fs.renameSync(fichier.fullPath, destinationPath);
  console.log(`✅ ${fichier.name} déplacé vers ${destinationPath}`);
  console.log(`   Dossier créé: ${destinationDir}`);
  console.log(`   Fichier final: ${finalFileName}`);
}
