<script setup lang="ts">
import type { PrimitiveProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { Primitive } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = withDefaults(
  defineProps<
    PrimitiveProps & {
      size?: 'sm' | 'md'
      isActive?: boolean
      class?: HTMLAttributes['class']
      disabled?: boolean
    }
  >(),
  {
    as: 'a',
    size: 'md'
  }
)
</script>

<template>
  <Primitive
    data-slot="sidebar-menu-sub-button"
    data-sidebar="menu-sub-button"
    :as="as"
    :as-child="asChild"
    :data-size="size"
    :data-active="isActive"
    :data-disabled="disabled"
    :class="
      cn(
        'text-sidebar-foreground ring-sidebar-ring [&>svg]:text-sidebar-accent-foreground outline-hidden flex h-7 min-w-0 -translate-x-px items-center gap-2 overflow-hidden rounded-md px-2 hover:bg-orange-100/70 focus-visible:ring-2 active:bg-orange-100 data-[disabled=true]:hover:bg-transparent data-[disabled=true]:active:bg-transparent [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0',
        'data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground',
        size === 'sm' && 'text-xs',
        size === 'md' && 'text-sm',
        'group-data-[collapsible=icon]:hidden',
        props.class
      )
    "
  >
    <slot />
  </Primitive>
</template>
