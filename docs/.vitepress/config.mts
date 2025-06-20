import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Centre d'assistance Deemply",
  description: "Centre d'assistance Deemply",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Accueil', link: '/' },
      { text: 'Guide', link: '/guide' }
    ],

    sidebar: [
      {
        text: 'Guide',
        items: []
      }
    ],

    socialLinks: [
      { icon: 'linkedin', link: 'https://www.linkedin.com/company/deemply' },
      { icon: 'instagram', link: 'https://www.instagram.com/deemply_official' },
      { icon: 'youtube', link: 'https://www.youtube.com/@deemply' }
    ]
  }
})
