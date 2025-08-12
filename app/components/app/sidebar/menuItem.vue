<template>
  <SidebarMenuSubButton
    as-child
    :disabled="isDisabled"
    :class="{
      'cursor-default opacity-50': isDisabled
    }"
  >
    <NuxtLink
      class="flex items-center rounded-md px-3 py-6"
      :to="isDisabled ? undefined : to"
      :class="[{ 'w-max': isDisabled }, { 'bg-orange-100 font-medium': isActive }]"
    >
      <div class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md">
        <component :is="icon" class="text-sidebar-primary h-4 w-4" />
      </div>
      <span>{{ title }}</span>
    </NuxtLink>
  </SidebarMenuSubButton>
</template>

<script setup lang="ts">
const props = defineProps<{
  title: string
  to?: string
  icon: any
  isDisabled?: boolean
}>()

const route = useRoute()
const isActive = computed(() => {
  if (!props.to || props.isDisabled) return false

  const normalize = (path: string) => {
    if (!path) return '/'
    // remove trailing slashes except for root
    const normalized = path.replace(/\/+$/, '')
    return normalized === '' ? '/' : normalized
  }

  const currentPath = normalize(route.path)
  const targetPath = normalize(props.to)

  if (currentPath === targetPath) return true
  return currentPath.startsWith(targetPath + '/')
})
</script>
