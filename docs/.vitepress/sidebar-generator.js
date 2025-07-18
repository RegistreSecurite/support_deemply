import fs from 'fs'
import path from 'path'

/**
 * Génère automatiquement la sidebar basée sur la structure des dossiers
 * @param {string} docsPath - Chemin vers le dossier docs
 * @returns {Object} Configuration de la sidebar
 */
export function generateSidebar(docsPath = './docs') {
  const sidebar = {}
  
  // Fonction récursive pour parcourir les dossiers
  function buildSidebarFromDirectory(dirPath, basePath = '') {
    const items = []
    
    try {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true })
        .filter(entry => !entry.name.startsWith('.') && !entry.name.startsWith('_'))
        .sort((a, b) => {
          // Trier les dossiers avant les fichiers, puis par ordre numérique des préfixes
          if (a.isDirectory() && !b.isDirectory()) return -1
          if (!a.isDirectory() && b.isDirectory()) return 1
          
          // Extraire les numéros de préfixe (ex: "1 - Activités" -> 1)
          const getPrefix = (name) => {
            const match = name.match(/^(\d+)\s*-\s*/)
            return match ? parseInt(match[1], 10) : 999999 // Les fichiers sans préfixe à la fin
          }
          
          const prefixA = getPrefix(a.name)
          const prefixB = getPrefix(b.name)
          
          // Si les deux ont des préfixes numériques, trier par numéro
          if (prefixA !== 999999 && prefixB !== 999999) {
            return prefixA - prefixB
          }
          
          // Si un seul a un préfixe, celui avec préfixe vient en premier
          if (prefixA !== 999999 && prefixB === 999999) return -1
          if (prefixA === 999999 && prefixB !== 999999) return 1
          
          // Si aucun n'a de préfixe, trier alphabétiquement
          return a.name.localeCompare(b.name)
        })
      
      // Créer des maps pour détecter les conflits nom de dossier/fichier
      const directories = new Map()
      const markdownFiles = new Map()
      
      // Première passe : cataloguer les dossiers et fichiers .md
      for (const entry of entries) {
        if (entry.isDirectory()) {
          directories.set(entry.name, entry)
        } else if (entry.name.endsWith('.md')) {
          const fileName = entry.name.replace('.md', '')
          markdownFiles.set(fileName, entry)
        }
      }
      
      // Deuxième passe : traiter les entrées en évitant les doublons
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name)
        const relativePath = path.join(basePath, entry.name)
        
        if (entry.isDirectory()) {
          // Vérifier s'il existe un fichier .md avec le même nom dans le répertoire courant
          const hasMatchingMdFile = markdownFiles.has(entry.name)
          
          // Vérifier s'il existe un fichier .md avec le même nom DANS le dossier
          let hasMatchingMdFileInside = false
          try {
            const insideEntries = fs.readdirSync(fullPath, { withFileTypes: true })
            hasMatchingMdFileInside = insideEntries.some(insideEntry => 
              insideEntry.isFile() && 
              insideEntry.name === `${entry.name}.md`
            )
          } catch (error) {
            // Ignore les erreurs de lecture du dossier
          }
          
          if (hasMatchingMdFileInside) {
            // Le dossier contient un fichier .md avec le même nom, afficher directement le fichier
            const mdFilePath = path.join(relativePath, `${entry.name}.md`)
            items.push({
              text: formatTitle(entry.name),
              link: `/${mdFilePath.replace(/\\/g, '/').replace('.md', '')}`
            })
          } else if (!hasMatchingMdFile) {
            // Pas de fichier .md correspondant, traiter le dossier normalement
            const children = buildSidebarFromDirectory(fullPath, relativePath)
            
            if (children.length > 0) {
              items.push({
                text: formatTitle(entry.name),
                collapsed: false,
                items: children
              })
            } else {
              // Dossier vide, on l'ajoute quand même pour la structure
              items.push({
                text: formatTitle(entry.name),
                collapsed: false,
                items: []
              })
            }
          }
          // Si hasMatchingMdFile est true, on ignore le dossier
        } else if (entry.name.endsWith('.md')) {
          // C'est un fichier markdown
          const fileName = entry.name.replace('.md', '')
          
          // Ne pas inclure index.md dans la sidebar (il sera la page d'accueil)
          if (fileName !== 'index') {
            items.push({
              text: formatTitle(fileName),
              link: `/${relativePath.replace(/\\/g, '/').replace('.md', '')}`
            })
          }
        }
      }
    } catch (error) {
      console.warn(`Erreur lors de la lecture du dossier ${dirPath}:`, error.message)
    }
    
    return items
  }
  
  // Fonction pour formater le titre
  function formatTitle(name) {
    // Supprimer les numéros de préfixe (ex: "1 - Activités" -> "Activités")
    let title = name.replace(/^\d+\s*-\s*/, '')
    
    // Capitaliser la première lettre
    title = title.charAt(0).toUpperCase() + title.slice(1)
    
    return title
  }
  
  // Générer la sidebar pour le dossier guide
  const guidePath = path.join(docsPath, 'guide')
  if (fs.existsSync(guidePath)) {
    sidebar['/guide/'] = buildSidebarFromDirectory(guidePath, 'guide')
  }
  
  // Générer la sidebar pour le dossier release
  const releasePath = path.join(docsPath, 'release')
  if (fs.existsSync(releasePath)) {
    sidebar['/release/'] = buildSidebarFromDirectory(releasePath, 'release')
  }
  
  return sidebar
}

/**
 * Génère la navigation principale basée sur la structure des dossiers
 * @param {string} docsPath - Chemin vers le dossier docs
 * @returns {Array} Configuration de la navigation
 */
export function generateNav(docsPath = './docs') {
  const nav = [
    { text: 'Accueil', link: '/' }
  ]
  
  try {
    const entries = fs.readdirSync(docsPath, { withFileTypes: true })
      .filter(entry => entry.isDirectory() && !entry.name.startsWith('.') && !entry.name.startsWith('_'))
      .sort((a, b) => a.name.localeCompare(b.name))
    
    for (const entry of entries) {
      if (entry.name === 'public') continue // Ignorer le dossier public
      
      nav.push({
        text: formatNavTitle(entry.name),
        link: `/${entry.name}/`
      })
    }
  } catch (error) {
    console.warn(`Erreur lors de la génération de la navigation:`, error.message)
  }
  
  return nav
}

function formatNavTitle(name) {
  // Capitaliser la première lettre
  return name.charAt(0).toUpperCase() + name.slice(1)
}

// Export par défaut pour la compatibilité
export default {
  generateSidebar,
  generateNav
}
