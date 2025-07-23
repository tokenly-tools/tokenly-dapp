<template>
  <SidebarProvider>
    <AppSidebar />
    <SidebarInset>
      <AppSidebarHeader />
      <div class="flex flex-1 flex-col gap-4 p-4">
        <slot />
      </div>
    </SidebarInset>
  </SidebarProvider>
</template>

<script setup lang="ts"></script>
