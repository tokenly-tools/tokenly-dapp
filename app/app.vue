<template>
  <Toaster
    :toast-options="{
      duration: 5000,
      classes: {
        title: '!text-black',
        description: '!text-black'
      }
    }"
  />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
