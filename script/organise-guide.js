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

// Fonction pour mettre à jour les références d'images dans les fichiers markdown
function updateImageReferencesInMarkdownFiles(files, oldPath, newPath) {
  // Normaliser les chemins pour les comparaisons
  const normalizedOldPath = oldPath.replace(/\\/g, '/');
  
  for (const file of files) {
    try {
      const content = fs.readFileSync(file.fullPath, 'utf8');
      
      // Rechercher les références d'images dans le markdown
      // Format: ![alt](chemin/vers/image.jpg) ou <img src="chemin/vers/image.jpg">
      const markdownImgRegex = new RegExp(`!\\[([^\\]]*)\\]\\(([^\\)]*(${normalizedOldPath})[^\\)]*)\\)`, 'g');
      const htmlImgRegex = new RegExp(`<img[^>]*src=["']([^"']*${normalizedOldPath}[^"']*)`, 'g');
      
      // Remplacer les références
      let updatedContent = content.replace(markdownImgRegex, (match, alt, path) => {
        return `![${alt}](${newPath})`;
      });
      
      updatedContent = updatedContent.replace(htmlImgRegex, (match, path) => {
        return match.replace(path, newPath);
      });
      
      // Écrire le contenu mis à jour si des modifications ont été faites
      if (content !== updatedContent) {
        fs.writeFileSync(file.fullPath, updatedContent, 'utf8');
        console.log(`✅ Références d'images mises à jour dans ${file.relativePath}`);
      }
    } catch (error) {
      console.error(`❌ Erreur lors de la mise à jour des références d'images dans ${file.relativePath}:`, error.message);
    }
  }
}

// Fonction pour chercher récursivement les fichiers .md et les images dans tous les sous-dossiers
function findMarkdownFiles(dir, files = [], images = []) {
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      // Chercher récursivement dans les sous-dossiers
      findMarkdownFiles(fullPath, files, images);
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
    } else if (/\.(png|jpg|jpeg|gif|svg|webp)$/i.test(item)) {
      // Ajouter l'image à la liste des images à traiter
      const relativePath = path.relative(sourceDir, fullPath);
      images.push({
        name: item,
        fullPath: fullPath,
        relativePath: relativePath,
        directory: path.dirname(fullPath)
      });
    }
  }
  
  return { files, images };
}

// Vérifier si le dossier source existe
if (!fs.existsSync(sourceDir)) {
  console.log('Dossier source non trouvé:', sourceDir);
  process.exit(0);
}

// Dossier public pour les images
const publicImagesDir = path.join(__dirname, '..', 'docs', 'public', 'images');

// Créer le dossier public/images s'il n'existe pas
if (!fs.existsSync(publicImagesDir)) {
  fs.mkdirSync(publicImagesDir, { recursive: true });
  console.log(`✅ Dossier public/images créé: ${publicImagesDir}`);
}

// Chercher tous les fichiers .md et images dans docs/guide et ses sous-dossiers
const { files: fichiers, images } = findMarkdownFiles(sourceDir);

if (fichiers.length === 0) {
  console.log('Aucun guide détecté.');
}

if (images.length > 0) {
  console.log(`📷 ${images.length} images détectées à déplacer vers public/images`);
  
  // Traiter chaque image
  for (const image of images) {
    // Générer un nom de fichier unique pour éviter les collisions
    const uniquePrefix = Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
    const imageExt = path.extname(image.name);
    const imageName = path.basename(image.name, imageExt);
    const uniqueImageName = `${imageName}-${uniquePrefix}${imageExt}`;
    
    // Chemin de destination dans public/images
    const imageDestination = path.join(publicImagesDir, uniqueImageName);
    
    try {
      // Copier l'image vers public/images
      fs.copyFileSync(image.fullPath, imageDestination);
      console.log(`✅ Image copiée: ${image.name} -> public/images/${uniqueImageName}`);
      
      // Mettre à jour les références dans les fichiers markdown
      updateImageReferencesInMarkdownFiles(fichiers, image.relativePath, `/images/${uniqueImageName}`);
      
      // Supprimer l'image originale
      fs.unlinkSync(image.fullPath);
      console.log(`🚮 Image originale supprimée: ${image.fullPath}`);
    } catch (error) {
      console.error(`❌ Erreur lors du traitement de l'image ${image.name}:`, error.message);
    }
  }
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
    // Nouvelle logique: créer un dossier avec le même nom que le fichier dans le chemin du folder
    destinationDir = path.join(destinationBase, folderPath, fichier.name.replace('.md', ''));
    finalFileName = `${title.normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .toLowerCase()}.md`;
  } else if (folderPath) {
    destinationDir = path.join(destinationBase, folderPath, fichier.name.replace('.md', ''));
    finalFileName = `${title.normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .toLowerCase()}.md`;
  } else if (title) {
    // Fallback si pas de folder mais un titre
    destinationDir = path.join(destinationBase, title);
    finalFileName = `${title.normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .toLowerCase()}.md`;
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
