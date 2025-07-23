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
            <div class="p-2">
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
                  >
                    {{ childItem.title }}
                  </a>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            </SidebarMenuSub>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>
    </SidebarContent>
    <SidebarRail />
  </Sidebar>
</template>

<script setup lang="ts">
import { GalleryVerticalEnd } from 'lucide-vue-next';

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  type SidebarProps,
  SidebarRail,
} from '@/components/ui/sidebar';

const props = defineProps<SidebarProps>();

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
        },
        {
          title: 'NFT minter (coming soon)',
          url: '#',
          isDisabled: true,
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
        },
        {
          title: 'Multisender',
          url: '#',
        },
        {
          title: 'Staking (coming soon)',
          url: '#',
          isDisabled: true,
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
        },
      ],
    },
  ],
};
</script>
