import { defineConfig } from 'vitepress'
import { generateSidebar } from './sidebar-generator.js'

export default defineConfig({
  title: 'Support Deemply',
  description: 'Documentation de support pour Deemply',
  
  // Configuration pour les fichiers statiques
  ignoreDeadLinks: true,
  
  // Autres configurations
  themeConfig: {
    search: {
      provider: 'local'
    },
    nav: [
      { text: 'Accueil', link: '/' },
      { text: 'Guide', link: '/guide/' },
      { text: 'Notes de mise à jour', link: '/release/' }
    ],
    
    sidebar: generateSidebar()
  }
})
