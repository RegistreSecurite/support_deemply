<template>
    <Layout>
      <template #doc-before>
        <div class="custom-header">
          <h1>{{ frontmatter.title }}</h1>
          <p class="subtitle">{{ frontmatter.subtitle }}</p>
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
  .custom-header {
    padding: 2rem 0;
    border-bottom: 1px solid var(--vp-c-divider);
    margin-bottom: 2rem;
  }
  </style>