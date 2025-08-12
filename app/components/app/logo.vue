<template>
  <div class="user-select-none h-full w-full overflow-hidden">
    <NuxtLink to="/" class="flex h-full w-full items-center justify-center">
      <img
        src="@/assets/images/logo.webp"
        alt="logo"
        class="user-select-none user-drag-none pointer-events-none h-full max-h-full w-full max-w-full object-contain"
        draggable="false"
      />
    </NuxtLink>
  </div>
</template>
