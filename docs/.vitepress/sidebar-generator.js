import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Génère la configuration de la sidebar en scannant le dossier guide
 * @returns {Object} Configuration de la sidebar
 */
export function generateSidebar() {
  const guideDir = path.join(__dirname, '..', 'guide');
  
  // Vérifier si le dossier guide existe
  if (!fs.existsSync(guideDir)) {
    console.warn('Le dossier guide n\'existe pas');
    return {};
  }
  
  // Générer la structure hiérarchique de la sidebar
  const sidebarStructure = generateSidebarStructure(guideDir);
  
  return {
    '/guide/': sidebarStructure
  };
}

/**
 * Génère la structure hiérarchique de la sidebar
 * @param {string} rootDir - Chemin du dossier racine
 * @returns {Array} Structure hiérarchique de la sidebar
 */
function generateSidebarStructure(rootDir) {
  const structure = [];
  const rootDirName = path.basename(rootDir);
  
  // Lire le contenu du dossier
  const items = fs.readdirSync(rootDir);
  
  // Traiter d'abord les fichiers du dossier courant
  const files = items
    .filter(item => {
      const itemPath = path.join(rootDir, item);
      return fs.statSync(itemPath).isFile() && path.extname(item) === '.md';
    })
    .sort((a, b) => {
      // Mettre index.md en premier
      if (a === 'index.md') return -1;
      if (b === 'index.md') return 1;
      return a.localeCompare(b);
    });
  
  // Traiter les fichiers du dossier courant
  const fileItems = files.map(file => {
    const filePath = path.join(rootDir, file);
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    
    // Extraire le titre du fichier Markdown (première ligne commençant par #)
    const titleMatch = fileContent.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1] : path.basename(file, '.md');
    
    // Convertir le chemin relatif en lien
    const relativePath = path.relative(path.join(__dirname, '..'), filePath).replace(/\\/g, '/');
    const link = '/' + relativePath.replace(/\.md$/, '');
    
    return { text: title, link };
  });
  
  // Ajouter les fichiers au niveau racine de la structure
  structure.push(...fileItems);
  
  // Traiter ensuite les sous-dossiers
  const directories = items
    .filter(item => {
      const itemPath = path.join(rootDir, item);
      return fs.statSync(itemPath).isDirectory();
    })
    .sort();
  
  // Traiter chaque sous-dossier
  directories.forEach(dir => {
    const dirPath = path.join(rootDir, dir);
    
    // Récupérer le titre du dossier (à partir d'un éventuel index.md ou du nom du dossier)
    let dirTitle = formatDirName(dir);
    const indexPath = path.join(dirPath, 'index.md');
    
    if (fs.existsSync(indexPath)) {
      const indexContent = fs.readFileSync(indexPath, 'utf-8');
      const titleMatch = indexContent.match(/^#\s+(.+)$/m);
      if (titleMatch) {
        dirTitle = titleMatch[1];
      }
    }
    
    // Générer récursivement la structure pour ce sous-dossier
    const children = generateSidebarStructure(dirPath);
    
    // Ajouter le sous-dossier à la structure s'il contient des éléments
    if (children.length > 0) {
      structure.push({
        text: dirTitle,
        collapsed: false,
        items: children
      });
    }
  });
  
  return structure;
}

/**
 * Formate le nom d'un dossier pour l'affichage
 * @param {string} dirName - Nom du dossier
 * @returns {string} Nom formaté
 */
function formatDirName(dirName) {
  // Mapping des noms de dossiers vers des noms plus lisibles
  const dirNameMapping = {
    'safetyRegister': 'Registre de sécurité',
    'commission': 'Commission',
    'employee': 'Employé',
    'observation': 'Observation',
    'prescription': 'Prescription',
    'training': 'Formation',
    'duerp': 'DUERP',
    'buildingManagement': 'Gestion des bâtiments',
    'accessibilityRegister': 'Registre d\'accessibilité',
    'entriesExits': 'Entrées/Sorties',
    'firePermits': 'Permis de feu',
    'preventionPlan': 'Plan de prévention',
    'healthRecord': 'Dossier médical',
    'form': 'Formulaire',
    'core': 'Core',
    'activities': 'Activités',
    'interventions': 'Interventions',
    'materials': 'Matériels',
    'others': 'Autres',
    'providers': 'Fournisseurs',
    'sites': 'Sites',
    'common': 'Commun'
  };
  
  return dirNameMapping[dirName] || dirName.charAt(0).toUpperCase() + dirName.slice(1);
}


