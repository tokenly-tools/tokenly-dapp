<template>
  <ClientOnly>
    <div>
      <Button v-if="!isConnected" @click="open">Connect</Button>
      <Button v-else @click="() => open({ view: 'Account' })">
        <div class="hidden md:block">{{ trimmedAddress }}</div>
        <div class="block md:hidden"><Wallet /></div>
      </Button>
    </div>
    <template #fallback>
      <Button disabled>Loading...</Button>
    </template>
  </ClientOnly>
</template>
<script setup lang="ts">
import { Wallet } from 'lucide-vue-next'
import { useAppKit, useAppKitAccount } from '@reown/appkit/vue'

// Only initialize AppKit on client side
const appKit = import.meta.client ? useAppKit() : null
const accountData = import.meta.client ? useAppKitAccount() : ref(null)

// @ts-ignore
function open(options) {
  if (appKit) {
    return options ? appKit.open(options) : appKit.open()
  }
}

const isConnected = computed(() => accountData.value?.isConnected ?? false)
const trimmedAddress = computed(() => {
  if (!accountData.value?.address) return ''
  return `${accountData.value.address.slice(0, 6)}...${accountData.value.address.slice(-4)}`
})
</script>
