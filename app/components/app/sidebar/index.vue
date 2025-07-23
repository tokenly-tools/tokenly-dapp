<template>
  <Sidebar v-bind="props">
    <SidebarHeader>
      <SidebarMenu>
        <SidebarMenuItem>
          <AppLogo class="justify-center px-2 py-4" />
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>
    <SidebarContent>
      <SidebarGroup>
        <SidebarMenu>
          <SidebarMenuItem v-for="item in data.navMain" :key="item.title">
            <div class="p-2 select-none font-semibold text-sidebar-foreground">
              {{ item.title }}
            </div>
            <SidebarMenuSub v-if="item.items.length">
              <SidebarMenuSubItem
                v-for="childItem in item.items"
                :key="childItem.title"
              >
                <SidebarMenuSubButton
                  as-child
                  :disabled="childItem.isDisabled"
                  :class="{
                    'opacity-50 cursor-not-allowed': childItem.isDisabled,
                  }"
                >
                  <a
                    :href="childItem.url"
                    :class="{ 'pointer-events-none': childItem.isDisabled }"
                    class="flex items-center px-3 py-6 rounded-md"
                  >
                    <div
                      class="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0"
                    >
                      <component
                        :is="childItem.icon"
                        class="w-4 h-4 text-sidebar-primary"
                      />
                    </div>
                    <span>{{ childItem.title }}</span>
                  </a>
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
  Package,
} from 'lucide-vue-next';

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
  SidebarRail,
} from '@/components/ui/sidebar';

const props = defineProps<{
  className?: string;
  [key: string]: any;
}>();

// Navigation data for Tokenly DApp
const data = {
  navMain: [
    {
      title: 'Minting',
      url: '#',
      items: [
        {
          title: 'Token minter',
          url: '#',
          icon: Coins,
        },
        {
          title: 'NFT minter (coming soon)',
          url: '#',
          isDisabled: true,
          icon: Palette,
        },
      ],
    },
    {
      title: 'Distribution & Engagement',
      url: '#',
      items: [
        {
          title: 'Airdrop',
          url: '#',
          icon: Gift,
        },
        {
          title: 'Multisender',
          url: '#',
          icon: Send,
        },
        {
          title: 'Launchpad',
          url: '#',
          icon: Rocket,
          badge: true,
        },
        {
          title: 'Staking (coming soon)',
          url: '#',
          isDisabled: true,
          icon: PiggyBank,
        },
      ],
    },
    {
      title: 'Asset Management',
      url: '#',
      items: [
        {
          title: 'Locker',
          url: '#',
          icon: Lock,
        },
      ],
    },
  ],
};
</script>
