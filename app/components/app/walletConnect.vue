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
      <div class="flex justify-end">
        <Button disabled>Loading...</Button>
      </div>
    </template>
  </ClientOnly>
</template>
<script setup lang="ts">
import { Wallet } from 'lucide-vue-next'

const { appKit, account, isConnected } = useWagmiClient()

function open(options?: any) {
  if (appKit) {
    return options ? appKit.open(options) : appKit.open()
  }
}

const trimmedAddress = computed(() => {
  if (!account.address.value) return ''
  return `${account.address.value.slice(0, 6)}...${account.address.value.slice(-4)}`
})
</script>
