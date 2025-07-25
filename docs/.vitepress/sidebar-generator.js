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
          // Trier les dossiers avant les fichiers
          if (a.isDirectory() && !b.isDirectory()) return -1
          if (!a.isDirectory() && b.isDirectory()) return 1
          
          // Si les deux sont des dossiers, vérifier s'ils ont un index.md avec un order
          if (a.isDirectory() && b.isDirectory()) {
            const indexPathA = path.join(dirPath, a.name, 'index.md')
            const indexPathB = path.join(dirPath, b.name, 'index.md')
            
            const dataA = extractFrontmatterData(indexPathA)
            const dataB = extractFrontmatterData(indexPathB)
            
            // Si les deux ont un order dans le frontmatter, les trier par order
            if (dataA.order !== 999 || dataB.order !== 999) {
              return dataA.order - dataB.order
            }
          }
          
          // Si les deux sont des fichiers, vérifier s'ils ont un order dans le frontmatter
          if (!a.isDirectory() && !b.isDirectory() && a.name.endsWith('.md') && b.name.endsWith('.md')) {
            const filePathA = path.join(dirPath, a.name)
            const filePathB = path.join(dirPath, b.name)
            
            const dataA = extractFrontmatterData(filePathA)
            const dataB = extractFrontmatterData(filePathB)
            
            // Si les deux ont un order dans le frontmatter, les trier par order
            if (dataA.order !== 999 || dataB.order !== 999) {
              return dataA.order - dataB.order
            }
          }
          
          // Fallback: Extraire les numéros de préfixe (ex: "1 - Activités" -> 1)
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
      
      // Fonction utilitaire pour normaliser les noms (minuscules, sans accents, tirets)
      function normalizeName(name) {
        return name
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "") // Enlever les accents
          .replace(/[^\w\s-]/g, "")     // Enlever les caractères spéciaux
          .replace(/\s+/g, "-")         // Remplacer les espaces par des tirets
          .toLowerCase();                 // Mettre en minuscules
      }
      
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
        const parentDirName = path.basename(dirPath)
        
        if (entry.isDirectory()) {
          // Vérifier s'il existe un fichier .md avec le même nom dans le répertoire courant
          const hasMatchingMdFile = markdownFiles.has(entry.name)
          
          // Vérifier si le nom du dossier correspond au dossier parent (avec espaces remplacés par des tirets)
          const normalizedDirName = normalizeName(entry.name)
          const normalizedParentName = normalizeName(parentDirName)
          const isSameAsParent = normalizedDirName === normalizedParentName
          
          // Vérifier s'il existe un fichier .md avec le même nom DANS le dossier
          let hasMatchingMdFileInside = false
          let hasFileWithSameNameAsDir = false
          try {
            const insideEntries = fs.readdirSync(fullPath, { withFileTypes: true })
            
            // Vérifie si le dossier contient un fichier .md avec exactement le même nom
            hasMatchingMdFileInside = insideEntries.some(insideEntry => 
              insideEntry.isFile() && 
              insideEntry.name === `${entry.name}.md`
            )
            
            // Vérifie si le dossier contient un fichier .md dont le nom normalisé correspond au nom normalisé du dossier
            hasFileWithSameNameAsDir = insideEntries.some(insideEntry => {
              if (!insideEntry.isFile() || !insideEntry.name.endsWith('.md')) {
                return false
              }
              const fileName = insideEntry.name.replace('.md', '')
              const normalizedFileName = normalizeName(fileName)
              const normalizedDirName = normalizeName(entry.name)
              return normalizedFileName === normalizedDirName
            })
          } catch (error) {
            // Ignore les erreurs de lecture du dossier
          }
          
          // Vérifier si le dossier contient un fichier index.md
          let hasIndexMd = false;
          try {
            const insideEntries = fs.readdirSync(fullPath, { withFileTypes: true })
            hasIndexMd = insideEntries.some(insideEntry => 
              insideEntry.isFile() && insideEntry.name === 'index.md'
            )
          } catch (error) {
            // Ignore les erreurs de lecture du dossier
          }
          
          // Si le dossier contient un fichier avec le même nom (normalisé), on ignore le dossier mais on ajoute le fichier
          if (hasFileWithSameNameAsDir) {
            console.log(`Ignoring directory ${entry.name} as it contains a file with the same normalized name`)
            
            // Trouver le fichier correspondant et l'ajouter directement à ce niveau
            try {
              const insideEntries = fs.readdirSync(fullPath, { withFileTypes: true })
              for (const insideEntry of insideEntries) {
                if (insideEntry.isFile() && insideEntry.name.endsWith('.md')) {
                  const fileName = insideEntry.name.replace('.md', '')
                  const normalizedFileName = normalizeName(fileName)
                  const normalizedDirName = normalizeName(entry.name)
                  
                  if (normalizedFileName === normalizedDirName) {
                    // Ajouter le fichier directement à ce niveau
                    const mdFilePath = path.join(relativePath, insideEntry.name)
                    const fullMdPath = path.join(fullPath, insideEntry.name)
                    const titleFromMd = extractTitleFromMarkdown(fullMdPath)
                    
                    items.push({
                      text: titleFromMd || formatTitle(fileName, dirPath),
                      link: `/${mdFilePath.replace(/\\/g, '/').replace('.md', '')}`
                    })
                    break
                  }
                }
              }
            } catch (error) {
              console.warn(`Erreur lors de la lecture du dossier ${fullPath}:`, error.message)
            }
            
            continue
          }
          
          if (hasMatchingMdFileInside) {
            // Le dossier contient un fichier .md avec le même nom, afficher directement le fichier
            const mdFilePath = path.join(relativePath, `${entry.name}.md`)
            const fullMdPath = path.join(dirPath, entry.name, `${entry.name}.md`)
            const titleFromMd = extractTitleFromMarkdown(fullMdPath)
            
            items.push({
              text: titleFromMd || formatTitle(entry.name, fullPath),
              link: `/${mdFilePath.replace(/\\/g, '/').replace('.md', '')}`
            })
          } else if (!hasMatchingMdFile) {
            // Pas de fichier .md correspondant, traiter le dossier normalement
            const children = buildSidebarFromDirectory(fullPath, relativePath)
            
            if (children.length > 0) {
              // Si le dossier contient un fichier index.md, on l'affiche comme un dossier
              // Sinon, on ajoute directement son contenu au niveau parent
              if (hasIndexMd) {
                const indexPath = path.join(fullPath, 'index.md')
                const frontmatterData = extractFrontmatterData(indexPath)
                
                items.push({
                  text: frontmatterData.title || formatTitle(entry.name, fullPath),
                  collapsed: false,
                  items: children,
                  order: frontmatterData.order // Ajouter l'ordre pour le tri final
                })
              } else {
                // Ajouter directement les enfants au niveau parent
                console.log(`Adding children of ${entry.name} directly to parent as it does not contain index.md`)
                items.push(...children)
              }
            } else if (hasIndexMd) {
              // Dossier vide avec index.md, on l'ajoute quand même pour la structure
              const indexPath = path.join(fullPath, 'index.md')
              const frontmatterData = extractFrontmatterData(indexPath)
              
              items.push({
                text: frontmatterData.title || formatTitle(entry.name, fullPath),
                collapsed: false,
                items: [],
                order: frontmatterData.order // Ajouter l'ordre pour le tri final
              })
            }
          }
          // Si hasMatchingMdFile est true, on ignore le dossier
        } else if (entry.name.endsWith('.md')) {
          // C'est un fichier markdown
          const fileName = entry.name.replace('.md', '')
          
          // Ne pas inclure index.md dans la sidebar (il sera la page d'accueil)
          if (fileName !== 'index') {
            const titleFromMd = extractTitleFromMarkdown(fullPath)
            
            // Vérifier si le nom du fichier correspond au dossier parent (avec espaces remplacés par des tirets)
            const normalizedFileName = normalizeName(fileName)
            const normalizedParentName = normalizeName(parentDirName)
            const isSameAsParent = normalizedFileName === normalizedParentName
            
            // Si c'est le cas, on lui donne une priorité spéciale dans la sidebar
            if (isSameAsParent) {
              console.log(`File ${fileName} matches parent directory ${parentDirName}, giving special treatment`)
            }
            
            items.push({
              text: titleFromMd || formatTitle(fileName, dirPath),
              link: `/${relativePath.replace(/\\/g, '/').replace('.md', '')}`,
              isParentFile: isSameAsParent
            })
          }
        }
      }
    } catch (error) {
      console.warn(`Erreur lors de la lecture du dossier ${dirPath}:`, error.message)
    }
    
    // Tri final des éléments basé sur la propriété order
    items.sort((a, b) => {
      const orderA = a.order || 999
      const orderB = b.order || 999
      
      if (orderA !== orderB) {
        return orderA - orderB
      }
      
      // Si même ordre, trier alphabétiquement par texte
      return a.text.localeCompare(b.text)
    })
    
    // Nettoyer la propriété order des éléments finaux
    items.forEach(item => {
      if (item.order !== undefined) {
        delete item.order
      }
    })
    
    return items
  }
  
  /**
   * Extrait les métadonnées du frontmatter d'un fichier markdown
   * @param {string} filePath - Chemin vers le fichier markdown
   * @returns {Object} Les métadonnées extraites (title, order, etc.)
   */
  function extractFrontmatterData(filePath) {
    const result = {
      title: null,
      order: 999 // Valeur par défaut si order n'est pas spécifié
    }
    
    try {
      if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath, 'utf8')
        
        // Vérifier si le fichier a un frontmatter (entre --- et ---)
        const frontmatterMatch = fileContent.match(/^---([\s\S]*?)---/)
        
        if (frontmatterMatch && frontmatterMatch[1]) {
          const frontmatter = frontmatterMatch[1]
          
          // Extraire le titre du frontmatter
          const titleMatch = frontmatter.match(/title:\s*([^\n]+)/)
          if (titleMatch && titleMatch[1]) {
            result.title = titleMatch[1].trim()
          }
          
          // Extraire l'ordre du frontmatter
          const orderMatch = frontmatter.match(/order:\s*(\d+)/)
          if (orderMatch && orderMatch[1]) {
            result.order = parseInt(orderMatch[1], 10)
          }
        }
      }
      return result
    } catch (error) {
      console.warn(`Erreur lors de l'extraction des métadonnées de ${filePath}:`, error.message)
      return result
    }
  }
  
  /**
   * Extrait le titre du frontmatter d'un fichier markdown
   * @param {string} filePath - Chemin vers le fichier markdown
   * @returns {string|null} Le titre extrait ou null si non trouvé
   */
  function extractTitleFromMarkdown(filePath) {
    return extractFrontmatterData(filePath).title
  }

  // Fonction pour formater le titre
  function formatTitle(name, dirPath) {
    // Vérifier s'il existe un fichier index.md dans le dossier
    const indexPath = path.join(dirPath, 'index.md')
    const titleFromIndex = extractTitleFromMarkdown(indexPath)
    
    if (titleFromIndex) {
      return titleFromIndex
    }
    
    // Sinon, utiliser le formatage standard
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
