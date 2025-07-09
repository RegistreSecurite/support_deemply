import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Support Deemply',
  description: 'Documentation de support pour Deemply',
  
  // Configuration pour les fichiers statiques
  ignoreDeadLinks: true,
  
  // Autres configurations
  themeConfig: {
    nav: [
      { text: 'Accueil', link: '/' },
      { text: 'Guide', link: '/guide/' }
    ],
    
    sidebar: [
      {
        text: 'Guide',
        items: [
          { text: 'Introduction', link: '/guide/' }
        ]
      }
    ]
  }
})
