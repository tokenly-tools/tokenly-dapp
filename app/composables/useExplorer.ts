import { CHAINS_BY_ID } from '@/lib/chains'

function normalizeBaseUrl(url?: string) {
  return url ? url.replace(/\/$/, '') : undefined
}

export function useExplorer() {
  const { chainId } = useWagmiClient()

  const baseUrl = computed(() => {
    const url = CHAINS_BY_ID[chainId.value ?? 1114]?.blockExplorers?.default?.url
    return normalizeBaseUrl(url)
  })

  const addressUrl = (address?: string) => {
    if (!address) return undefined
    const base = baseUrl.value
    return base ? `${base}/address/${address}` : undefined
  }

  const txUrl = (hash?: string) => {
    if (!hash) return undefined
    const base = baseUrl.value
    return base ? `${base}/tx/${hash}` : undefined
  }

  const tokenUrl = (address?: string) => {
    if (!address) return undefined
    const base = baseUrl.value
    return base ? `${base}/token/${address}` : undefined
  }

  return { baseUrl, addressUrl, txUrl, tokenUrl }
}
