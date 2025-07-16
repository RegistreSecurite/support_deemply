import { defineConfig , Plugin } from 'vitepress';
import { generateSidebar } from './sidebar-generator.js';

export default defineConfig({
  title: 'Support Deemply',
  description: 'Documentation d\'aide pour Deemply',
  markdown: {
    config(md) {
      md.use(injectTitlePlugin)
    }
  },
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

const injectTitlePlugin = {
    name: 'inject-title-h1',
    transform(code, id, options) {
      // Ne traite que les fichiers .md avec frontmatter
      if (!id.endsWith('.md') || !options?.frontmatter?.title) return
  
      const title = options.frontmatter.title.trim()
      const lines = code.split('\n')
  
      // Si un titre H1 existe déjà, on ne fait rien
      const alreadyHasH1 = lines.find((line) => line.trim().startsWith('# '))
      if (alreadyHasH1) return
  
      // Injecte le titre au début
      return `# ${title}\n\n${code}`
    }
  }
