<template>
  <Toaster
    class="toaster group"
    :toast-options="{
      duration: 5000,
      classes: {
        title: '!text-black',
        description: '!text-black'
      }
    }"
    :style="{
      '--normal-bg': 'var(--popover)',
      '--normal-text': 'var(--primary)',
      '--normal-border': 'var(--border)'
    }"
  />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
