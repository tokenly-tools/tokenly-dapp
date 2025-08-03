<template>
  <SidebarProvider>
    <AppSidebar />
    <SidebarInset>
      <AppSidebarHeader />
      <div class="mx-auto w-full max-w-5xl flex-1 p-4">
        <slot />
      </div>
      <AppFooter />
    </SidebarInset>
  </SidebarProvider>
</template>
