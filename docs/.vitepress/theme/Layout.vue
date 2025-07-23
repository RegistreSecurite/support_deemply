<template>
    <Layout>
      <template #doc-top>
        <div style="max-width: 688px; margin: 0 auto;">
          <div class="vp-doc h1">
            <h1 id="custom-title" tabindex="-1">
              {{ frontmatter.title }}
            <a class="header-anchor" href="#custom-title" aria-label="Permalink to &quot;{{ frontmatter.title }}&quot;"></a>
          </h1>
        </div>
        </div>
      </template>
    </Layout>
  </template>
  
  <script setup>
  import DefaultTheme from 'vitepress/theme'
  import { useData } from 'vitepress'
  
  const Layout = DefaultTheme.Layout
  const { frontmatter, page } = useData()
  </script>
  
  <style>
  /* Masquer le premier H1 du contenu markdown si nécessaire */
  .vp-doc .content-container h1:first-of-type {
    display: none;
  }
  </style>