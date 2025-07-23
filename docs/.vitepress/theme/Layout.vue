<template>
    <div class="layout">
      <h1>{{ frontmatter.title }}</h1>
      <Content />
    </div>
  </template>
  
  <script setup>
  import { useData } from 'vitepress'
  const { frontmatter } = useData()
  </script>
  