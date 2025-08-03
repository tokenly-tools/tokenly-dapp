<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
import { createAppKit } from '@reown/appkit/vue'
import { sepolia, type AppKitNetwork } from '@reown/appkit/networks'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'

const projectId = 'b07c56ffa4adafe96b3cef2f9419ea01'

const metadata = {
  name: 'tokenly',
  description: 'tokenly tools',
  url: 'https://tokenly.tools',
  icons: ['https://avatars.githubusercontent.com/u/220561751']
}

const networks: [AppKitNetwork, ...AppKitNetwork[]] = [sepolia]

const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId
})

createAppKit({
  adapters: [wagmiAdapter],
  networks,
  projectId,
  metadata,
  features: {
    analytics: true,
    email: false,
    socials: []
  },
  themeVariables: {
    '--w3m-accent': '#dc4f1a'
  }
})
</script>
