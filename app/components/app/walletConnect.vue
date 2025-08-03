<template>
  <div>
    <Button @click="open" v-if="!isConnected">Connect</Button>
    <Button v-else @click="open({ view: 'Account' })">
      <div class="hidden md:block">{{ trimmedAddress }}</div>
      <div class="block md:hidden"><Wallet /></div>
    </Button>
  </div>
</template>
<script setup lang="ts">
import { Wallet } from 'lucide-vue-next'
import { useAppKit, useAppKitAccount } from '@reown/appkit/vue'
const { open } = useAppKit()
const accountData = useAppKitAccount()

const isConnected = computed(() => accountData.value?.isConnected)
const trimmedAddress = computed(() => {
  if (!accountData.value?.address) return ''
  return `${accountData.value.address.slice(0, 6)}...${accountData.value.address.slice(-4)}`
})
</script>
