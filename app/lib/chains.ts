import { defineChain } from 'viem'
import type { AppKitNetwork } from '@reown/appkit/networks'

export const coreMainnet = defineChain({
  id: 1116,
  caipNetworkId: 'eip155:1116',
  chainNamespace: 'eip155',
  name: 'Core',
  nativeCurrency: { name: 'Core', symbol: 'CORE', decimals: 18 },
  rpcUrls: { default: { http: ['https://rpc.coredao.org'], webSocket: [] } },
  blockExplorers: { default: { name: 'CoreScan', url: 'https://scan.coredao.org' } },
  contracts: {}
}) as unknown as AppKitNetwork

export const coreTestnet2 = defineChain({
  id: 1114,
  caipNetworkId: 'eip155:1114',
  chainNamespace: 'eip155',
  name: 'Core Testnet 2',
  nativeCurrency: { name: 'Test Core 2', symbol: 'TCORE2', decimals: 18 },
  rpcUrls: { default: { http: ['https://rpc.test2.btcs.network'], webSocket: [] } },
  blockExplorers: {
    default: { name: 'Core Testnet 2 Scan', url: 'https://scan.test2.btcs.network' }
  },
  contracts: {}
}) as unknown as AppKitNetwork

export const SUPPORTED_NETWORKS = [coreMainnet, coreTestnet2] as [
  AppKitNetwork,
  ...AppKitNetwork[]
]

export const CHAINS_BY_ID = {
  [coreMainnet.id]: coreMainnet,
  [coreTestnet2.id]: coreTestnet2
} as const
