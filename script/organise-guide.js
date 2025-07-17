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

// Fonction pour mapper les dossiers Decap CMS vers la structure hiérarchique
function mapDecapFolderToHierarchy(folderName) {
  // Pattern: [parent]_[child] -> [Parent]/[Child]
  if (folderName.includes('_')) {
    const [parent, child] = folderName.split('_');
    
    // Mapping spécifique pour les dossiers connus
    const mappings = {
      'fonctionnalités-communes': 'Fonctionnalités communes',
      'activitiés': 'Activités',
      'activities': 'Activités',
      'interventions': 'Interventions',
      'materials': 'Matériels',
      'sites': 'Sites',
      'providers': 'Fournisseurs',
      'others': 'Autres'
    };
    
    const mappedParent = mappings[parent] || parent;
    const mappedChild = mappings[child] || child;
    
    return `${mappedParent}/${mappedChild}`;
  }
  
  return folderName;
}

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
      const directoryName = path.basename(path.dirname(fullPath));
      
      files.push({
        name: item,
        fullPath: fullPath,
        relativePath: relativePath,
        directory: path.dirname(fullPath),
        decapFolder: directoryName
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
  console.log(`📁 Dossier Decap: ${fichier.decapFolder}`);
  
  // Lire le contenu du fichier pour déterminer la catégorie
  const contenu = fs.readFileSync(fichier.fullPath, 'utf8');
  const frontmatterMatch = contenu.match(/^---\s*\n([\s\S]*?)\n---/);
  
  let destinationDir = destinationBase;
  let finalFileName = fichier.name;
  let folderPath = '';
  let title = '';
  
  // Extraire le titre du frontmatter
  if (frontmatterMatch) {
    const frontmatter = frontmatterMatch[1];
    const titleMatch = frontmatter.match(/title:\s*["']?([^"'\n]+)["']?/);
    if (titleMatch) {
      title = titleMatch[1].trim();
    }
  }
  
  // Priorité 1: Utiliser le frontmatter folder (plus fiable)
  if (frontmatterMatch) {
    const frontmatter = frontmatterMatch[1];
    const folderMatch = frontmatter.match(/folder:\s*["']?([^"'\n]+)["']?/);
    if (folderMatch) {
      folderPath = folderMatch[1].trim();
      console.log(`📁 Folder frontmatter: ${folderPath}`);
    }
  }
  
  // Priorité 2: Fallback sur le mapping du dossier Decap CMS si pas de frontmatter
  if (!folderPath && fichier.decapFolder.includes('_')) {
    folderPath = mapDecapFolderToHierarchy(fichier.decapFolder);
    console.log(`🔄 Mapping Decap fallback: ${fichier.decapFolder} -> ${folderPath}`);
  }
  
  console.log(`📝 Titre détecté: ${title || 'aucun'}`);
  
  // Construire le chemin de destination
  if (folderPath && title) {
    destinationDir = path.join(destinationBase, folderPath, title);
    finalFileName = 'index.md';
  } else if (folderPath) {
    destinationDir = path.join(destinationBase, folderPath);
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
