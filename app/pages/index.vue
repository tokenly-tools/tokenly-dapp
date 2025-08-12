<template>
  <div class="flex flex-1 flex-col gap-4">
    <div class="text-2xl font-medium">Quick actions</div>
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
      <AppCard
        title="Mint token"
        :icon="Coins"
        description="Create a token"
        color="orange"
        to="/mint/token"
      />
      <AppCard
        title="Airdrop"
        :icon="Gift"
        description="Airdrop tokens/NFTs"
        color="amber"
      />
      <AppCard
        title="Multisender"
        :icon="Send"
        description="Send tokens to multiple recipients"
        color="indigo"
      />
    </div>
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <AppCard
        title="Locker"
        :icon="Lock"
        description="Lock tokens for a period of time"
        color="orange"
        class="md:min-h-[260px]"
        to="/locks"
      />
      <AppCard
        title="Follow us"
        :icon="Share2"
        description="Follow us on social media"
        color="rose"
        href="https://lnk.bio/tokenly"
      />
    </div>
  </div>
</template>
<script lang="ts" setup>
import { Coins, Gift, Lock, Send, Share2 } from 'lucide-vue-next'
</script>
