import { ref, computed, readonly } from 'vue'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from '@wagmi/vue'
import { parseEther } from 'viem'

// ERC20TokenFactory ABI
const ERC20_TOKEN_FACTORY_ABI = [
  {
    inputs: [],
    name: 'EmptyName',
    type: 'error'
  },
  {
    inputs: [],
    name: 'EmptySymbol',
    type: 'error'
  },
  {
    inputs: [],
    name: 'InvalidInitialHolder',
    type: 'error'
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'tokenAddress',
        type: 'address'
      },
      {
        indexed: false,
        internalType: 'string',
        name: 'name',
        type: 'string'
      },
      {
        indexed: false,
        internalType: 'string',
        name: 'symbol',
        type: 'string'
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'initialHolder',
        type: 'address'
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'initialSupply',
        type: 'uint256'
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'creator',
        type: 'address'
      }
    ],
    name: 'TokenCreated',
    type: 'event'
  },
  {
    inputs: [
      {
        internalType: 'string',
        name: 'name',
        type: 'string'
      },
      {
        internalType: 'string',
        name: 'symbol',
        type: 'string'
      },
      {
        internalType: 'address',
        name: 'initialHolder',
        type: 'address'
      },
      {
        internalType: 'uint256',
        name: 'initialSupply',
        type: 'uint256'
      }
    ],
    name: 'createToken',
    outputs: [
      {
        internalType: 'address',
        name: 'tokenAddress',
        type: 'address'
      }
    ],
    stateMutability: 'nonpayable',
    type: 'function'
  }
] as const

// Temporary hardcoded factory address (replace with actual deployed address)
const FACTORY_ADDRESS = '0x8e646b49ad209c7d2452c821f1746ebf518c55fe' as const

export interface MintTokenParams {
  tokenName: string
  tokenSymbol: string
  totalSupply: string
}

export interface MintTokenResult {
  tokenAddress?: string
  transactionHash?: string
  error?: string
}

export function useMintToken() {
  // Wagmi hooks
  const { address: connectedAddress, isConnected } = useAccount()
  const { writeContract, data: hash, error: writeError, isPending: isWritePending } = useWriteContract()
  
  // Local state
  const isLoading = ref(false)
  const result = ref<MintTokenResult>({})
  const lastMintParams = ref<MintTokenParams | null>(null)

  // Transaction receipt tracking
  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: confirmError
  } = useWaitForTransactionReceipt({
    hash
  })

  // Computed states
  const isMinting = computed(() => isLoading.value || isWritePending.value || isConfirming.value)
  const hasError = computed(() => !!(writeError.value || confirmError.value || result.value.error))
  const isSuccess = computed(() => isConfirmed.value && !hasError.value)

  /**
   * Mint a new token using the ERC20TokenFactory contract
   */
  const mintToken = async (params: MintTokenParams): Promise<MintTokenResult> => {
    try {
      // Reset previous state
      result.value = {}
      isLoading.value = true
      lastMintParams.value = params

      // Check wallet connection
      if (!isConnected.value || !connectedAddress.value) {
        throw new Error('Wallet not connected')
      }

      // Validate parameters
      if (!params.tokenName.trim()) {
        throw new Error('Token name is required')
      }
      if (!params.tokenSymbol.trim()) {
        throw new Error('Token symbol is required')
      }
      if (!params.totalSupply.trim()) {
        throw new Error('Total supply is required')
      }

      // Convert total supply to wei (assuming the input is in token units)
      const totalSupplyWei = parseEther(params.totalSupply)

      // Prepare contract call
      const contractArgs = [
        params.tokenName,
        params.tokenSymbol,
        connectedAddress.value, // initialHolder is the connected wallet
        totalSupplyWei
      ] as const

      // Call the contract
      writeContract({
        address: FACTORY_ADDRESS,
        abi: ERC20_TOKEN_FACTORY_ABI,
        functionName: 'createToken',
        args: contractArgs
      })

      // The transaction hash will be available in the `hash` ref from useWriteContract
      // The component can watch for isConfirmed to know when the transaction is complete

      return {
        transactionHash: hash.value
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      result.value = { error: errorMessage }
      console.error('Error minting token:', error)
      return { error: errorMessage }
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Reset the minting state
   */
  const reset = () => {
    result.value = {}
    lastMintParams.value = null
  }

  /**
   * Get the current error message
   */
  const getErrorMessage = () => {
    if (writeError.value) {
      return `Transaction failed: ${writeError.value.message}`
    }
    if (confirmError.value) {
      return `Transaction confirmation failed: ${confirmError.value.message}`
    }
    if (result.value.error) {
      return result.value.error
    }
    return null
  }

  return {
    // State
    isMinting,
    isLoading: readonly(isLoading),
    isWritePending,
    isConfirming,
    isConfirmed,
    isSuccess,
    hasError,
    
    // Data
    connectedAddress,
    isConnected,
    transactionHash: hash,
    result: readonly(result),
    lastMintParams: readonly(lastMintParams),
    
    // Methods
    mintToken,
    reset,
    getErrorMessage,
    
    // Raw errors for debugging
    writeError,
    confirmError
  }
}