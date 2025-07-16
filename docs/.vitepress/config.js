import { defineConfig } from 'vitepress';
import { generateSidebar } from './sidebar-generator.js';

export default defineConfig({
  title: 'Support Deemply',
  description: 'Documentation d\'aide pour Deemply',
  themeConfig: {
    logo: '/images/logo.png',
    nav: [
      { text: 'Accueil', link: '/' },
      { text: 'Guide', link: '/guide/' }
    ],
    sidebar: generateSidebar(),
    socialLinks: [
      { icon: 'github', link: 'https://github.com/RegistreSecurite/support_deemply' }
    ],
    footer: {
      message: 'Documentation Deemply',
      copyright: '© Deemply'
    }
  },
  // Autres options de configuration VitePress
  lastUpdated: true,
  cleanUrls: true,
});
