import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContract
} from '@wagmi/vue'
import type { Ref } from 'vue'
import { useAppKit } from '@reown/appkit/vue'

export function useWagmiClient() {
  // Only run on client side
  if (!import.meta.client) {
    return {
      account: {
        address: ref(null) as Ref<`0x${string}` | null>,
        isConnected: ref(false) as Ref<boolean>
      },
      writeContract: {
        writeContract: () => {},
        data: ref(undefined) as Ref<`0x${string}` | undefined>,
        error: ref(null),
        isPending: ref(false) as Ref<boolean>
      },
      receipt: {
        isLoading: ref(false) as Ref<boolean>,
        isSuccess: ref(false) as Ref<boolean>,
        error: ref(null)
      },
      readContract: (_params: unknown) => {
        return {
          data: ref(null) as Ref<unknown>,
          error: ref(null) as Ref<unknown>,
          isFetching: ref(false) as Ref<boolean>,
          refetch: async () => {}
        }
      },
      createWriteContract: () => {
        return {
          writeContract: () => {},
          data: ref(undefined) as Ref<`0x${string}` | undefined>,
          error: ref(null) as Ref<unknown>,
          isPending: ref(false) as Ref<boolean>
        }
      },
      waitForTransactionReceipt: (_params: {
        hash: Ref<`0x${string}` | null | undefined>
      }) => {
        return {
          data: ref(null) as Ref<unknown>,
          isLoading: ref(false) as Ref<boolean>,
          isSuccess: ref(false) as Ref<boolean>,
          error: ref(null) as Ref<unknown>
        }
      },
      appKit: null,
      openConnectModal: () => {},
      isConnected: ref(false) as Ref<boolean>,
      chainId: ref(1116) as Ref<number>
    }
  }

  // Client-side hooks
  const account = useAccount()
  const writeContract = useWriteContract()
  const { data: hash } = writeContract

  // Initialize AppKit for wallet connection
  const appKit = useAppKit()
  const isConnected = computed(() => account.isConnected.value ?? false)

  const readContract = <TParams>(params: TParams) =>
    (useReadContract as unknown as (p: TParams) => ReturnType<typeof useReadContract>)(
      params
    )

  const createWriteContract = () => useWriteContract()

  const waitForTransactionReceipt = (params: {
    hash: Ref<`0x${string}` | null | undefined>
  }) => {
    const normalizedParams = {
      ...params,
      hash: computed(() => params.hash.value ?? undefined)
    }
    return (
      useWaitForTransactionReceipt as unknown as (
        p: typeof normalizedParams
      ) => ReturnType<typeof useWaitForTransactionReceipt>
    )(normalizedParams)
  }

  return {
    account,
    writeContract,
    receipt: useWaitForTransactionReceipt({ hash }),
    readContract,
    createWriteContract,
    waitForTransactionReceipt,
    appKit,
    openConnectModal: appKit.open,
    isConnected,
    chainId: account.chainId
  }
}
