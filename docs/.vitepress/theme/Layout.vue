<template>
    <Layout>
      <template #doc-top>
        <div>
          <h1>{{ frontmatter.title }}</h1>
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
  </style>