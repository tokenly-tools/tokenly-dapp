<template>
  <div class="relative mx-auto max-w-2xl">
    <div class="sticky top-0 z-10 w-full pb-2 backdrop-blur">
      <h1 class="mb-4 text-2xl font-bold">Lock ERC20 Tokens</h1>
      <form @submit="onSubmit">
        <div class="space-y-4">
          <FormField v-slot="{ componentField }" name="tokenAddress">
            <FormItem>
              <FormLabel>Token Address</FormLabel>
              <FormControl>
                <Input type="text" placeholder="0x..." v-bind="componentField" />
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>

          <FormField v-slot="{ componentField }" name="amount">
            <FormItem>
              <FormLabel>Amount</FormLabel>
              <FormControl>
                <Input type="text" placeholder="Enter amount" v-bind="componentField" />
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>

          <FormField v-slot="{ componentField }" name="unlockDate">
            <FormItem>
              <FormLabel>Unlock Date & Time</FormLabel>
              <FormControl>
                <DateTimePicker v-bind="componentField" />
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>

          <Button type="submit" class="w-full" :disabled="isBtnDisabled" require-wallet>
            {{ isLocking ? 'Locking...' : 'Create Lock' }}
          </Button>
        </div>
      </form>
      <h2 class="mt-4 text-xl font-semibold">Active Locks</h2>
    </div>
    <div class="w-full">
      <div>
        <div v-if="isFetchingLocks" class="text-muted-foreground text-sm">
          Loading locks…
        </div>
        <div v-else>
          <div
            v-if="formattedActiveLocks.length === 0"
            class="text-muted-foreground text-sm"
          >
            No active locks found for your address.
          </div>
          <div v-else class="space-y-3">
            <div
              v-for="lock in formattedActiveLocks"
              :key="`${lock.lockId}-${lock.token}`"
              class="rounded-md border p-3"
            >
              <div class="flex items-center justify-between">
                <div class="font-medium">
                  {{ lock.tokenSymbol || 'TOKEN' }}
                </div>
                <div class="text-muted-foreground text-sm">ID #{{ lock.lockId }}</div>
              </div>
              <div class="flex items-center justify-between">
                <div>
                  <div class="mt-1 text-sm">
                    <span class="font-semibold">Amount:</span>
                    {{ lock.amountFormatted }}
                  </div>
                  <div class="text-sm">
                    <span class="font-semibold">Unlocks:</span>
                    {{ lock.endTimeFormatted }}
                  </div>
                  <div class="text-muted-foreground break-all text-xs">
                    <span class="font-semibold">Token:</span>
                    {{ lock.token }}
                  </div>
                </div>
                <div>
                  <Button as-child size="sm" variant="outline" require-wallet>
                    <NuxtLink :to="`/locks/${lock.lockId}`">Extend Lock</NuxtLink>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import DateTimePicker from '@/components/ui/datetime/DateTimePicker.vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { isAddress, parseUnits, formatUnits } from 'viem'
import * as z from 'zod'
import { ERC20_LOCKER_ABI, ERC20_MINIMAL_ABI, LOCKER_READER_ABI } from '@/abis/allAbis'
import { formatHHMM } from '@/utils/dateHelpers'
// Use wagmi via our composable wrapper
const { readContract, createWriteContract, waitForTransactionReceipt } = useWagmiClient()

const formSchema = toTypedSchema(
  z.object({
    tokenAddress: z
      .string()
      .refine(v => isAddress(v as `0x${string}`), 'Invalid token address'),
    amount: z
      .string()
      .min(1, 'Amount is required')
      .refine(value => {
        const num = Number(value)
        return !isNaN(num) && num > 0
      }, 'Amount must be greater than 0'),
    unlockDate: z
      .string()
      .min(1, 'Unlock date is required')
      .refine(value => {
        const ts = Date.parse(value)
        return !Number.isNaN(ts) && ts > Date.now() - 1000
      }, 'Unlock date must be in the future')
  })
)

const form = useForm({
  validationSchema: formSchema,
  initialValues: {
    tokenAddress: '',
    amount: '',
    unlockDate: ''
  }
})

// Read ERC20 decimals when tokenAddress becomes valid
const tokenAddress = computed(() => form.values.tokenAddress as `0x${string}`)
const isValidTokenAddress = computed(() =>
  isAddress((tokenAddress.value || '') as `0x${string}`)
)

const { data: tokenDecimals, refetch: refetchDecimals } = readContract({
  abi: ERC20_MINIMAL_ABI,
  address: computed(() =>
    isValidTokenAddress.value ? tokenAddress.value : undefined
  ) as any,
  functionName: 'decimals',
  query: {
    enabled: computed(() => isValidTokenAddress.value)
  }
})

// Current allowance for the locker
const { data: currentAllowance, refetch: refetchAllowance } = readContract({
  abi: ERC20_MINIMAL_ABI,
  address: computed(() =>
    isValidTokenAddress.value ? tokenAddress.value : undefined
  ) as any,
  functionName: 'allowance',
  args: computed(() => {
    if (
      isValidTokenAddress.value &&
      isConnected.value &&
      connectedAddress.value &&
      lockerAddress.value
    ) {
      return [connectedAddress.value!, lockerAddress.value!] as const
    }
    return undefined
  }) as any,
  query: {
    enabled: computed(
      () => isValidTokenAddress.value && isConnected.value && !!connectedAddress.value
    )
  }
})

// Separate approval write flow to avoid interfering with the main tx state
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

watch(tokenAddress, () => {
  if (isValidTokenAddress.value) {
    refetchDecimals()
  }
})

const {
  isPending: isLocking,
  writeContract: writeContractFn,
  isSuccess: isLockSuccess,
  isConnected,
  connectedAddress
} = useContractTransaction({
  successMessage: 'Tokens locked successfully!',
  errorMessage: 'Failed to create lock. Please try again.',
  pendingMessage: 'Creating your lock...',
  onSuccess: () => form.resetForm()
})

// Resolve per-chain addresses via composable
const { get: getAddress } = useAddresses()
const lockerAddress = computed(() => getAddress('lockerAddress'))
const lockerReaderAddress = computed(() => getAddress('lockerReaderAddress'))

// Read all active locks from LockerReader and filter for connected user
const {
  data: allLocksRaw,
  isFetching: isFetchingLocks,
  refetch: refetchAllLocks
} = readContract({
  abi: LOCKER_READER_ABI,
  address: computed(() => (lockerReaderAddress.value || undefined) as any),
  functionName: 'getAllLocks',
  query: {
    enabled: computed(
      () => isConnected.value && !!connectedAddress.value && !!lockerReaderAddress.value
    )
  }
})

const activeLocks = computed(() => {
  const list = (allLocksRaw.value as any[] | undefined) || []
  const user = (connectedAddress.value || '').toLowerCase()
  return list.filter(l => (l.owner as string)?.toLowerCase() === user)
})

const formattedActiveLocks = computed(() => {
  return activeLocks.value.map(l => {
    const decimals = Number(l.tokenDecimals ?? 18)
    const amountFormatted = formatUnits(BigInt(l.amount), decimals)
    return {
      ...l,
      amountFormatted,
      endTimeFormatted: formatHHMM(l.endTime)
    }
  })
})

// After a successful lock tx, refresh the list
watch(isLockSuccess, ok => {
  if (ok) refetchAllLocks()
})

const isBtnDisabled = computed(() => {
  return (
    isLocking.value ||
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
  const decimals = Number(tokenDecimals.value)
  if (decimals === undefined) {
    throw new Error('Decimals are undefined')
  }
  const amountWei = parseUnits(values.amount, decimals)

  // Convert datetime-local string to Unix timestamp (seconds)
  const endTime = Math.floor(new Date(values.unlockDate).getTime() / 1000)

  // Ensure we have a locker address for current network
  const lockerAddr = lockerAddress.value as `0x${string}`
  if (!lockerAddr) {
    throw new Error('Locker contract address is not configured for this network')
  }

  // Ensure allowance
  await refetchAllowance()
  const allowance = (currentAllowance.value ?? 0n) as bigint
  if (allowance < amountWei) {
    // Send approval
    writeApprove({
      address: tokenAddress.value,
      abi: ERC20_MINIMAL_ABI,
      functionName: 'approve',
      args: [lockerAddr, amountWei]
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
      // Do not proceed to create lock if approval was cancelled
      return
    }
    $toast.success('Approval confirmed. Proceeding to create lock...')
  }

  // Proceed with lock transaction
  writeContractFn({
    address: lockerAddr,
    abi: ERC20_LOCKER_ABI,
    functionName: 'lock',
    args: [
      connectedAddress.value!,
      values.tokenAddress as `0x${string}`,
      amountWei,
      BigInt(endTime)
    ] as const
  })
})
</script>
