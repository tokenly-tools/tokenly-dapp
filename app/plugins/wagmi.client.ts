import { createAppKit } from '@reown/appkit/vue'
import { sepolia, type AppKitNetwork } from '@reown/appkit/networks'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { WagmiPlugin } from '@wagmi/vue'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'

export default defineNuxtPlugin((nuxtApp) => {
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

  // Create QueryClient for TanStack Query
  const queryClient = new QueryClient()

  // Register Wagmi plugin with Vue
  nuxtApp.vueApp.use(WagmiPlugin, { config: wagmiAdapter.wagmiConfig })
  
  // Register Vue Query plugin
  nuxtApp.vueApp.use(VueQueryPlugin, { queryClient })

  // Create AppKit
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
})