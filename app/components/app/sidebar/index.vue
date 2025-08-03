<template>
  <Sidebar v-bind="props">
    <SidebarHeader>
      <SidebarMenu>
        <SidebarMenuItem>
          <AppLogo class="hidden justify-center px-2 py-4 md:flex" />
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
                <SidebarMenuSubButton
                  as-child
                  :disabled="childItem.isDisabled"
                  :class="{
                    'cursor-not-allowed opacity-50': childItem.isDisabled
                  }"
                >
                  <NuxtLink
                    :to="childItem.to"
                    :class="{ 'pointer-events-none': childItem.isDisabled }"
                    class="flex items-center rounded-md px-3 py-6"
                  >
                    <div class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md">
                      <component :is="childItem.icon" class="text-sidebar-primary h-4 w-4" />
                    </div>
                    <span>{{ childItem.title }}</span>
                  </NuxtLink>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            </SidebarMenuSub>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>
    </SidebarContent>
  </Sidebar>
</template>

<script setup lang="ts">
import {
  Coins,
  Gift,
  Users,
  Lock,
  Image as ImageIcon,
  Zap,
  Send,
  Rocket,
  PiggyBank,
  Vault,
  Palette,
  Package
} from 'lucide-vue-next'

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail
} from '@/components/ui/sidebar'

const props = defineProps<{
  className?: string
  [key: string]: any
}>()

// Navigation data for Tokenly DApp
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
          title: 'NFT minter (coming soon)',
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
          url: '#',
          icon: Send
        },
        {
          title: 'Launchpad (coming soon)',
          to: '#',
          icon: Rocket,
          isDisabled: true,
          badge: true
        },
        {
          title: 'Staking (coming soon)',
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
</script>
