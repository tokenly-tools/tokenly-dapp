interface UseContractTransactionOptions {
  successMessage?: string
  errorMessage?: string
  pendingMessage?: string
  onSuccess?: () => void
  onError?: () => void
}

export function useContractTransaction(options: UseContractTransactionOptions = {}) {
  const { account, writeContract, receipt } = useWagmiClient()
  const { $toast } = useNuxtApp()
  const { address: connectedAddress, isConnected } = account
  const { txUrl } = useExplorer()
  const {
    writeContract: originalWriteContractFn,
    data: hash,
    error: writeError,
    isPending: isWritePending
  } = writeContract
  const { isLoading: isConfirming, isSuccess: isConfirmed, error: confirmError } = receipt

  // Computed states
  const isPending = computed(() => isWritePending.value || isConfirming.value)
  const hasError = computed(() => !!(writeError.value || confirmError.value))
  const isSuccess = computed(() => isConfirmed.value && !hasError.value)

  // Track pending notification
  let pendingToastId: string | number | undefined

  // Wrapped writeContractFn with wallet connection check
  const writeContractFn: typeof originalWriteContractFn = params => {
    if (!isConnected.value || !connectedAddress.value) {
      console.error('Please connect your wallet first')
      return
    }

    return originalWriteContractFn(params)
  }

  const getErrorMessage = () => {
    if (writeError.value) {
      return options.errorMessage || `Transaction failed: ${writeError.value.message}`
    }
    if (confirmError.value) {
      return (
        options.errorMessage ||
        `Transaction confirmation failed: ${confirmError.value.message}`
      )
    }
    return null
  }

  const getSuccessMessage = () => {
    return options.successMessage || 'Transaction successful!'
  }

  const getPendingMessage = () => {
    return options.pendingMessage || 'Transaction pending...'
  }

  const dismissPendingToast = () => {
    if (pendingToastId) {
      $toast.dismiss(pendingToastId)
      pendingToastId = undefined
    }
  }

  watch(isConfirming, newIsConfirming => {
    if (newIsConfirming && hash.value) {
      dismissPendingToast()

      pendingToastId = $toast.info(getPendingMessage(), {
        duration: Infinity
      })
    } else if (!newIsConfirming) {
      dismissPendingToast()
    }
  })

  // Watch for success and error states
  watch(isSuccess, newSuccess => {
    if (newSuccess && hash.value) {
      dismissPendingToast()

      const message = getSuccessMessage()
      $toast.success(message, {
        action: {
          label: 'View',
          onClick: () => {
            window.open(txUrl(hash.value), '_blank')
          }
        }
      })
      options.onSuccess?.()
    }
  })

  watch(hasError, newHasError => {
    if (newHasError) {
      dismissPendingToast()

      const errorMessage = getErrorMessage()
      if (errorMessage) {
        $toast.error(errorMessage, {
          action: {
            label: 'View',
            onClick: () => {
              window.open(txUrl(hash.value), '_blank')
            }
          }
        })
      }
      options.onError?.()
    }
  })

  return {
    // States
    isPending,
    hasError,
    isSuccess,
    hash,

    // Actions
    writeContract: writeContractFn,

    // Error handling
    getErrorMessage,
    getSuccessMessage,
    getPendingMessage,

    // Account info
    isConnected,
    connectedAddress
  }
}
