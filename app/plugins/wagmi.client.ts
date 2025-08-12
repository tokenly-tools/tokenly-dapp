import { createAppKit } from '@reown/appkit/vue'
import { type AppKitNetwork } from '@reown/appkit/networks'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { WagmiPlugin } from '@wagmi/vue'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { SUPPORTED_NETWORKS } from '@/lib/chains'

export default defineNuxtPlugin(nuxtApp => {
  const projectId = 'b07c56ffa4adafe96b3cef2f9419ea01'

  const metadata = {
    name: 'tokenly',
    description: 'tokenly tools',
    url: 'https://tokenly.tools',
    icons: ['https://avatars.githubusercontent.com/u/220561751']
  }

  const networks: [AppKitNetwork, ...AppKitNetwork[]] = SUPPORTED_NETWORKS

  const wagmiAdapter = new WagmiAdapter({
    networks,
    projectId
  })

  const queryClient = new QueryClient()

  nuxtApp.vueApp.use(WagmiPlugin, { config: wagmiAdapter.wagmiConfig })
  nuxtApp.vueApp.use(VueQueryPlugin, { queryClient })

  // Create AppKit
  createAppKit({
    adapters: [wagmiAdapter],
    networks,
    projectId,
    metadata,
    features: {
      analytics: false,
      email: false,
      socials: []
    },
    themeVariables: {
      '--w3m-accent': '#dc4f1a'
    }
  })
})
