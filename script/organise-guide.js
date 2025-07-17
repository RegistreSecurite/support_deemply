const fs = require('fs');
const path = require('path');

// Dossier source où Decap CMS crée les fichiers temporaires
const sourceDir = path.join(__dirname, '..', '.netlify', 'cms', 'preview');

// Dossier de destination pour les guides
const destinationBase = path.join(__dirname, '..', 'docs', 'guide');

// Vérifier si le dossier source existe
if (!fs.existsSync(sourceDir)) {
  console.log('Dossier source non trouvé:', sourceDir);
  process.exit(0);
}

const fichiers = fs.readdirSync(sourceDir).filter(f => f.endsWith('.md'));

if (fichiers.length === 0) {
  console.log('Aucun guide détecté.');
  process.exit(0);
}

for (const fichier of fichiers) {
  const sourcePath = path.join(sourceDir, fichier);
  
  // Lire le contenu du fichier pour déterminer la catégorie
  const contenu = fs.readFileSync(sourcePath, 'utf8');
  const frontmatterMatch = contenu.match(/^---\s*\n([\s\S]*?)\n---/);
  
  let destinationDir = destinationBase;
  let finalFileName = fichier;
  
  if (frontmatterMatch) {
    const frontmatter = frontmatterMatch[1];
    
    // Extraire le champ folder
    const folderMatch = frontmatter.match(/folder:\s*["']?([^"'\n]+)["']?/);
    // Extraire le titre
    const titleMatch = frontmatter.match(/title:\s*["']?([^"'\n]+)["']?/);
    
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
  
  // Créer le dossier de destination s'il n'existe pas
  fs.mkdirSync(destinationDir, { recursive: true });
  
  // Déplacer le fichier
  fs.renameSync(sourcePath, destinationPath);
  console.log(`✅ ${fichier} déplacé vers ${destinationPath}`);
  console.log(`   Dossier créé: ${destinationDir}`);
  console.log(`   Fichier final: ${finalFileName}`);
}
