<template>
  <div class="mx-auto mt-4 max-w-2xl md:mt-0">
    <h1 class="mb-6 text-2xl font-bold">Multisender</h1>
    <div>
      <form @submit="onSubmit">
        <div class="space-y-4">
          <FormField v-slot="{ componentField }" name="tokenAddress">
            <FormItem>
              <FormLabel>Token Address</FormLabel>
              <FormControl>
                <Input
                  type="text"
                  placeholder="Enter token address (0x...)"
                  v-bind="componentField"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>

          <FormField v-slot="{ componentField }" name="recipientsAndAmounts">
            <FormItem>
              <FormLabel>Recipients</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="0x123...,1000&#10;0x0987...,5000"
                  v-bind="componentField"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>

          <Button type="submit" class="w-full" :disabled="isBtnDisabled" require-wallet>
            {{ isSending ? 'Sending...' : 'Send Tokens' }}
          </Button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { parseEther, isAddress } from 'viem'
import * as z from 'zod'
import { MULTISENDER_ABI, ERC20_MINIMAL_ABI } from '@/abis/allAbis'
import { useWagmiClient } from '@/composables/useWagmiClient'

const formSchema = toTypedSchema(
  z.object({
    tokenAddress: z
      .string()
      .min(1, 'Token address is required')
      .refine(value => isAddress(value), 'Invalid token address format'),
    recipientsAndAmounts: z
      .string()
      .min(1, 'Recipients and amounts are required')
      .refine(value => {
        const lines = value.split('\n').filter(line => line.trim().length > 0)
        if (lines.length === 0) return false

        return lines.every(line => {
          const parts = line.split(',')
          if (parts.length !== 2) return false

          const [address, amount] = parts
          if (!isAddress(address.trim())) return false

          const num = Number(amount.trim())
          return !isNaN(num) && num > 0
        })
      }, 'Invalid format. Use: address,amount (one per line)')
  })
)

const form = useForm({
  validationSchema: formSchema,
  initialValues: {
    tokenAddress: '',
    recipientsAndAmounts: ''
  }
})

const {
  isPending: isSending,
  writeContract: writeContractFn,
  connectedAddress
} = useContractTransaction({
  successMessage: 'Tokens sent successfully!',
  errorMessage: 'Failed to send tokens. Please try again.',
  pendingMessage: 'Sending tokens...',
  onSuccess: () => form.resetForm()
})

// Resolve multisender address via composable to ensure reactivity to chain
const { get: getAddress } = useAddresses()
const multisenderAddress = computed(
  () => getAddress('multisenderAddress') as `0x${string}`
)

// Prepare Wagmi composables in setup scope to preserve injection context
const { readContract, createWriteContract, waitForTransactionReceipt } = useWagmiClient()

// Read current allowance (disabled by default; triggered on submit via refetch)
const { data: currentAllowance, refetch: refetchAllowance } = readContract({
  abi: ERC20_MINIMAL_ABI,
  address: computed(() => form.values.tokenAddress as `0x${string}`),
  functionName: 'allowance',
  args: computed(() => [connectedAddress.value!, multisenderAddress.value] as const),
  query: { enabled: false }
})

// Separate approval write + receipt watcher
const approvalWrite = createWriteContract()
const {
  writeContract: writeApprove,
  data: approveHash,
  isPending: isApproving
} = approvalWrite
const { error: approveError } = approvalWrite
const approvalReceipt = waitForTransactionReceipt({ hash: approveHash })
const { $toast } = useNuxtApp()

let approvalPendingToastId: string | number | undefined
const dismissApprovalPendingToast = () => {
  if (approvalPendingToastId !== undefined) {
    $toast.dismiss(approvalPendingToastId)
    approvalPendingToastId = undefined
  }
}

const isBtnDisabled = computed(() => {
  return (
    isSending.value ||
    isApproving.value ||
    (!form.meta.value.pending && !form.meta.value.valid)
  )
})

// Prefill token from query if present
const route = useRoute()
watch(
  () => route.query.token,
  t => {
    if (typeof t === 'string' && isAddress(t)) {
      form.setFieldValue('tokenAddress', t)
    }
  },
  { immediate: true }
)

const onSubmit = form.handleSubmit(async values => {
  const lines = values.recipientsAndAmounts
    .split('\n')
    .filter(line => line.trim().length > 0)

  const recipients: `0x${string}`[] = []
  const amounts: bigint[] = []

  for (const line of lines) {
    const [address, amount] = line.split(',')
    if (address && amount) {
      recipients.push(address.trim() as `0x${string}`)
      amounts.push(parseEther(amount.trim()))
    }
  }

  if (recipients.length === 0) {
    throw new Error('No valid recipients found')
  }

  // Calculate total amount to transfer
  const totalAmount = amounts.reduce((acc, v) => acc + v, 0n)

  // Refresh allowance for current form values
  await refetchAllowance()

  const allowance = (currentAllowance.value ?? 0n) as bigint
  if (allowance < totalAmount) {
    writeApprove({
      address: values.tokenAddress as `0x${string}`,
      abi: ERC20_MINIMAL_ABI,
      functionName: 'approve',
      args: [multisenderAddress.value, totalAmount]
    })

    // Inform user that we are waiting for allowance approval confirmation
    dismissApprovalPendingToast()
    approvalPendingToastId = $toast.info('Waiting for allowance approval...', {
      duration: Infinity
    })

    let approvalCancelled = false
    await new Promise<void>((resolve, reject) => {
      let stopWriteErr: () => void = () => {}

      const stopErr = watch(
        approvalReceipt.error,
        e => {
          if (e) {
            dismissApprovalPendingToast()
            stopErr()
            stopOk()
            stopWriteErr()
            reject(e)
          }
        },
        { immediate: true }
      )
      const stopOk = watch(
        approvalReceipt.isSuccess,
        ok => {
          if (ok) {
            dismissApprovalPendingToast()
            stopErr()
            stopOk()
            stopWriteErr()
            resolve()
          }
        },
        { immediate: true }
      )
      stopWriteErr = watch(
        approveError,
        e => {
          if (e) {
            // User likely cancelled the approval in their wallet
            dismissApprovalPendingToast()
            stopErr()
            stopOk()
            stopWriteErr()
            approvalCancelled = true
            resolve()
          }
        },
        { immediate: true }
      )
    })
    if (approvalCancelled) {
      // Do not proceed to multisend if approval was cancelled
      return
    }
    $toast.success('Approval confirmed. Proceeding to multisend...')
  }

  writeContractFn({
    address: multisenderAddress.value,
    abi: MULTISENDER_ABI,
    functionName: 'multisendToken',
    args: [values.tokenAddress as `0x${string}`, recipients, amounts] as const
  })
})
</script>
