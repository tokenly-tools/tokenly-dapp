<template>
  <footer class="flex flex-col items-center justify-between gap-4 text-sm sm:flex-row sm:gap-0">
    <div class="flex-1 text-center text-sm sm:text-left">Copyright © 2025 tokenly. All rights reserved.</div>
    <div class="mx-auto flex flex-1 items-center gap-4">
      <NuxtLink to="/privacy-policy" class="hover:underline">Privacy Policy</NuxtLink>
      <NuxtLink to="/terms-of-service" class="hover:underline">Terms of Service</NuxtLink>
    </div>
    <div class="flex items-center gap-1 text-center sm:text-left">
      Made with <Heart class="h-4 w-4" fill="red" /> by
      <a href="https://github.com/tokenly-tools" target="_blank" class="hover:underline">tokenly</a>
      team
    </div>
  </footer>
</template>

<script setup lang="ts">
import { Heart } from 'lucide-vue-next'
</script>
