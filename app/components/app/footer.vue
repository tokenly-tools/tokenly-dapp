<template>
  <footer class="flex items-center justify-between text-sm">
    <div class="text-sm">Copyright © 2025 tokenly. All rights reserved.</div>
    <div class="flex items-center gap-4">
      <NuxtLink to="/privacy-policy" class="hover:underline">Privacy Policy</NuxtLink>
      <NuxtLink to="/terms-of-service" class="hover:underline">Terms of Service</NuxtLink>
    </div>
    <div class="flex items-center gap-1">
      Made with <Heart class="h-4 w-4" fill="red" /> by
      <a href="https://github.com/tokenly-tools" target="_blank">tokenly</a>
      team
    </div>
  </footer>
</template>

<script setup lang="ts">
import { Heart } from 'lucide-vue-next'
</script>
