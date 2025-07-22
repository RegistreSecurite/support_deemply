import { defineConfig } from 'vitepress';
import { generateSidebar, generateNav } from './sidebar-generator.js';

// Définir le plugin MarkdownIt pour injecter les titres H1
function injectTitlePlugin(md) {
  // Sauvegarder la fonction de rendu originale
  const originalRender = md.render.bind(md);
  
  // Remplacer la fonction de rendu
  md.render = function(src, env) {
    // Vérifier si on a un titre dans le frontmatter et pas de H1 dans le contenu
    if (env && env.frontmatter && env.frontmatter.title) {
      const title = env.frontmatter.title.trim();
      const lines = src.split('\n');
      
      // Vérifier s'il y a déjà un titre H1
      const alreadyHasH1 = lines.find((line) => line.trim().startsWith('# '));
      
      // Si pas de H1, injecter le titre
      if (!alreadyHasH1) {
        src = `# ${title}\n\n${src}`;
      }
    }
    
    // Appeler la fonction de rendu originale avec le contenu modifié
    return originalRender(src, env);
  };
}

export default defineConfig({
  title: 'Support Deemply',
  description: 'Documentation d\'aide pour Deemply',
  markdown: {
    config(md) {
      injectTitlePlugin(md);
    }
  },
  themeConfig: {
    logo: '',
    nav: generateNav(),
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


