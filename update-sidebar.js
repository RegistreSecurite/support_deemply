#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Vérifie si des fichiers Markdown ont été modifiés dans le dossier guide
 * @returns {boolean} True si des fichiers ont été modifiés
 */
function checkForMarkdownChanges() {
  try {
    // Récupérer la liste des fichiers modifiés dans le dernier merge
    const output = execSync('git diff-tree -r --name-only --no-commit-id ORIG_HEAD HEAD', { 
      encoding: 'utf-8',
      cwd: __dirname
    });
    
    // Vérifier si des fichiers .md dans le dossier guide ont été modifiés
    const changedFiles = output.split('\n');
    const markdownChanges = changedFiles.some(file => 
      file.startsWith('docs/guide/') && file.endsWith('.md')
    );
    
    console.log('Fichiers modifiés dans le merge:', changedFiles);
    console.log('Modifications de fichiers Markdown dans guide:', markdownChanges);
    
    return markdownChanges;
  } catch (error) {
    console.error('Erreur lors de la vérification des fichiers modifiés:', error);
    return false;
  }
}

/**
 * Fonction principale
 */
function main() {
  console.log('Vérification des modifications après merge...');
  
  // Vérifier si des fichiers Markdown ont été modifiés
  if (checkForMarkdownChanges()) {
    console.log('Des fichiers Markdown ont été modifiés dans le dossier guide. Mise à jour de la sidebar...');
    
    try {
      // Importer dynamiquement le générateur de sidebar
      import('./docs/.vitepress/sidebar-generator.js')
        .then(module => {
          const { generateSidebar } = module;
          const sidebar = generateSidebar();
          
          console.log('Nouvelle configuration de la sidebar générée:', JSON.stringify(sidebar, null, 2));
          console.log('La sidebar a été mise à jour avec succès.');
        })
        .catch(error => {
          console.error('Erreur lors de la génération de la sidebar:', error);
        });
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la sidebar:', error);
    }
  } else {
    console.log('Aucune modification de fichiers Markdown dans le dossier guide. Aucune action nécessaire.');
  }
}

// Exécuter la fonction principale
main();
