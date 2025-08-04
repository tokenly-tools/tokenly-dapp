<template>
  <Sidebar v-bind="props">
    <SidebarHeader>
      <SidebarMenu>
        <SidebarMenuItem>
          <div class="flex h-14 w-full items-center justify-center p-2">
            <AppLogo class="hidden h-full w-full md:flex" />
          </div>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>
    <SidebarContent>
      <SidebarGroup>
        <SidebarMenu>
          <SidebarMenuItem v-for="item in data.navMain" :key="item.title">
            <div class="text-sidebar-foreground select-none p-2 font-semibold">
              {{ item.title }}
            </div>
            <SidebarMenuSub v-if="item.items.length">
              <SidebarMenuSubItem v-for="childItem in item.items" :key="childItem.title">
                <Tooltip v-if="childItem.isDisabled" :open="isMobile ? activeTooltip === childItem.title : undefined">
                  <TooltipTrigger as-child>
                    <AppSidebarMenuItem
                      :title="childItem.title"
                      :to="childItem.to"
                      :icon="childItem.icon"
                      :is-disabled="childItem.isDisabled"
                      @click="isMobile ? toggleTooltip(childItem.title, $event) : undefined"
                    />
                  </TooltipTrigger>
                  <TooltipContent side="right" :side-offset="-10">
                    <p>Coming soon</p>
                  </TooltipContent>
                </Tooltip>
                <AppSidebarMenuItem
                  v-else
                  :title="childItem.title"
                  :to="childItem.to"
                  :icon="childItem.icon"
                  :is-disabled="childItem.isDisabled"
                />
              </SidebarMenuSubItem>
            </SidebarMenuSub>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>
    </SidebarContent>
  </Sidebar>
</template>

<script setup lang="ts">
import { Coins, Gift, Lock, Send, Rocket, PiggyBank, Palette } from 'lucide-vue-next'
import { ref, onMounted, onUnmounted } from 'vue'
import { useMediaQuery } from '@vueuse/core'

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem
} from '@/components/ui/sidebar'

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

const props = defineProps<{
  className?: string
  [key: string]: any
}>()

const isMobile = useMediaQuery('(max-width: 768px)')
const activeTooltip = ref<string | null>(null)

const toggleTooltip = (itemTitle: string, event?: Event) => {
  event?.preventDefault()
  event?.stopPropagation()
  activeTooltip.value = activeTooltip.value === itemTitle ? null : itemTitle

  if (activeTooltip.value === itemTitle) {
    setTimeout(() => {
      activeTooltip.value = null
    }, 3000)
  }
}

const handleClickOutside = (event: Event) => {
  if (isMobile.value && activeTooltip.value) {
    const target = event.target as Element
    if (!target.closest('[data-radix-tooltip-trigger]')) {
      activeTooltip.value = null
    }
  }
}

const data = {
  navMain: [
    {
      title: 'Minting',
      url: '#',
      items: [
        {
          title: 'Token minter',
          to: '/mint/token',
          icon: Coins
        },
        {
          title: 'NFT minter',
          to: '#',
          isDisabled: true,
          icon: Palette
        }
      ]
    },
    {
      title: 'Distribution & Engagement',
      url: '#',
      items: [
        {
          title: 'Airdrop',
          to: '#',
          icon: Gift
        },
        {
          title: 'Multisender',
          to: '#',
          icon: Send
        },
        {
          title: 'Launchpad',
          to: '#',
          icon: Rocket,
          isDisabled: true,
          badge: true
        },
        {
          title: 'Staking',
          to: '#',
          isDisabled: true,
          icon: PiggyBank
        }
      ]
    },
    {
      title: 'Asset Management',
      url: '#',
      items: [
        {
          title: 'Locker',
          to: '#',
          icon: Lock
        }
      ]
    }
  ]
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>
