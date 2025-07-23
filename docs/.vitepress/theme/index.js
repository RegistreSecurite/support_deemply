import DefaultTheme from 'vitepress/theme'
import Layout from './Layout.vue'

export default {
  ...DefaultTheme,

  // si tu as un layout custom :
  Layout: Layout,
}