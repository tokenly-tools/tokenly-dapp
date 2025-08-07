import { useAccount, useWriteContract, useWaitForTransactionReceipt } from '@wagmi/vue'
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
        data: ref(null) as Ref<`0x${string}` | null>,
        error: ref(null),
        isPending: ref(false) as Ref<boolean>
      },
      receipt: {
        isLoading: ref(false) as Ref<boolean>,
        isSuccess: ref(false) as Ref<boolean>,
        error: ref(null)
      },
      appKit: null,
      openConnectModal: () => {},
      isConnected: ref(false) as Ref<boolean>
    }
  }

  // Client-side hooks
  const account = useAccount()
  const writeContract = useWriteContract()
  const { data: hash } = writeContract

  // Initialize AppKit for wallet connection
  const appKit = useAppKit()
  const isConnected = computed(() => account.isConnected.value ?? false)

  return {
    account,
    writeContract,
    receipt: useWaitForTransactionReceipt({ hash }),
    appKit,
    openConnectModal: appKit.open,
    isConnected
  }
}
