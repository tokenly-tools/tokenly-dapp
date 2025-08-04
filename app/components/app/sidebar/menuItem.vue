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
      active-class="bg-orange-100 font-medium"
      :to="isDisabled ? undefined : to"
      :class="{ 'w-max': isDisabled }"
    >
      <div class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md">
        <component :is="icon" class="text-sidebar-primary h-4 w-4" />
      </div>
      <span>{{ title }}</span>
    </NuxtLink>
  </SidebarMenuSubButton>
</template>

<script setup lang="ts">
import { SidebarMenuSubButton } from '@/components/ui/sidebar'

defineProps<{
  title: string
  to?: string
  icon: any
  isDisabled?: boolean
}>()
</script>
