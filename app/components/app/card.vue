<template>
  <div class="rounded-2xl p-6 flex flex-col justify-between min-h-[200px]">
    <div class="rounded-full px-4 py-2 text-sm font-medium mb-2"><Camera color="red" :size="32" />{{ title }}</div>
    <div class="text-2xl font-medium">{{ description }}</div>
  </div>
</template>
<script setup lang="ts">
import type { Component } from 'vue'
defineProps<{
  title: string
  icon: Component
  description: string
  color: string
}>()
</script>
