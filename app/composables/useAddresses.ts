export type ContractKey =
  | 'factoryAddress'
  | 'multisenderAddress'
  | 'lockerAddress'
  | 'lockerReaderAddress'

export function useAddresses() {
  const { chainId } = useWagmiClient()
  const cfg = useRuntimeConfig().public as any

  const addressesByChainId: Record<number, Record<ContractKey, `0x${string}` | ''>> = {
    1116: cfg.coreMainnet,
    1114: cfg.coreTestnet2
  }

  const current = computed(() => addressesByChainId[chainId.value ?? 1114])
  const get = (key: ContractKey) => current.value?.[key]

  return { current, get }
}
