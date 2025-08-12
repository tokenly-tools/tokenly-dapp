<template>
  <div class="mx-auto mt-4 max-w-2xl md:mt-0">
    <div class="mb-4">
      <Button as-child variant="link" size="sm" class="p-0 text-black">
        <NuxtLink to="/locks">← Back to Locks</NuxtLink>
      </Button>
    </div>
    <h1 class="mb-6 text-2xl font-bold">Extend Lock</h1>

    <div v-if="isFetching" class="text-muted-foreground text-sm">Loading lock…</div>
    <div v-else-if="!lockView" class="text-destructive text-sm">
      Lock not found or unavailable.
    </div>
    <div v-else>
      <div class="mb-6 rounded-md border p-3">
        <div class="flex items-center justify-between">
          <div class="font-medium">{{ lockView.tokenSymbol || 'TOKEN' }}</div>
          <div class="text-muted-foreground text-sm">ID #{{ lockView.lockId }}</div>
        </div>
        <div class="mt-1 text-sm">
          <span class="font-semibold">Amount:</span> {{ lockView.amountFormatted }}
        </div>
        <div class="text-sm">
          <span class="font-semibold">Current unlock:</span>
          {{ lockView.endTimeFormatted }}
        </div>
      </div>

      <form @submit="onSubmit">
        <div class="space-y-4">
          <FormField v-slot="{ componentField }" name="tokenAddress">
            <FormItem>
              <FormLabel>Token Address</FormLabel>
              <FormControl>
                <Input
                  type="text"
                  :placeholder="lockView.token"
                  v-bind="componentField"
                  disabled
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>

          <FormField v-slot="{ componentField }" name="unlockDate">
            <FormItem>
              <FormLabel>New Unlock Date & Time</FormLabel>
              <FormControl>
                <DateTimePicker v-bind="componentField" />
              </FormControl>
              <p class="text-muted-foreground mt-1 text-xs">
                Must be later than current unlock ({{ lockView.endTimeFormatted }})
              </p>
              <FormMessage />
            </FormItem>
          </FormField>

          <Button type="submit" class="w-full" :disabled="isBtnDisabled" require-wallet>
            {{ isExtending ? 'Extending…' : 'Extend Lock' }}
          </Button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import * as z from 'zod'
import { formatUnits } from 'viem'
import { ERC20_LOCKER_ABI, LOCKER_READER_ABI } from '@/abis/allAbis'
import { formatHHMM } from '@/utils/dateHelpers'

const route = useRoute()
const lockIdParam = computed(() => route.params.id as string)
const isValidLockId = computed(() => {
  const v = lockIdParam.value
  return typeof v === 'string' && v.length > 0 && /^\d+$/.test(v)
})
const lockId = computed(() => {
  try {
    return BigInt(lockIdParam.value)
  } catch {
    return 0n
  }
})

const { get: getAddress } = useAddresses()
const lockerAddress = computed(() => getAddress('lockerAddress'))
const lockerReaderAddress = computed(() => getAddress('lockerReaderAddress'))

const { readContract } = useWagmiClient()

const isReadyToLoad = computed(() => !!lockerReaderAddress.value && isValidLockId.value)

const {
  data: lockData,
  error: readError,
  isFetching,
  refetch
} = readContract({
  abi: LOCKER_READER_ABI,
  address: computed(() => (lockerReaderAddress.value || undefined) as any),
  functionName: 'getLock',
  args: computed(() => (isValidLockId.value ? [lockId.value] : undefined)) as any,
  query: {
    enabled: computed(() => isReadyToLoad.value)
  }
})

const lockView = computed(() => {
  const l: any = lockData.value as any
  if (!l) return null
  const decimals = Number(l.tokenDecimals ?? 18)
  const amountFormatted = formatUnits(BigInt(l.amount), decimals)
  return {
    ...l,
    amountFormatted,
    endTimeFormatted: formatHHMM(l.endTime)
  }
})

const {
  isPending: isExtending,
  writeContract: writeContractFn,
  isSuccess: isExtendSuccess,
  isConnected,
  connectedAddress
} = useContractTransaction({
  successMessage: 'Lock extended successfully!',
  errorMessage: 'Failed to extend lock. Please try again.',
  pendingMessage: 'Extending your lock...',
  onSuccess: () => {
    refetch()
  }
})

const formSchema = toTypedSchema(
  z.object({
    tokenAddress: z.string(),
    unlockDate: z
      .string()
      .min(1, 'Unlock date is required')
      .refine(value => {
        const ts = Date.parse(value)
        const current = Number((lockView.value?.endTime as any) ?? 0) * 1000
        return !Number.isNaN(ts) && ts > Math.max(current, Date.now() - 1000)
      }, 'New unlock date must be later than current')
  })
)

const form = useForm({
  validationSchema: formSchema,
  initialValues: {
    tokenAddress: '',
    unlockDate: ''
  }
})

watch(lockView, v => {
  if (v) {
    form.setValues({ tokenAddress: v.token, unlockDate: '' })
  }
})

const isOwner = computed(() => {
  const user = (connectedAddress.value || '').toLowerCase()
  const owner = (lockView.value?.owner || '').toLowerCase()
  return !!user && user === owner
})

const isBtnDisabled = computed(
  () =>
    isExtending.value ||
    !isOwner.value ||
    (!form.meta.value.pending && !form.meta.value.valid)
)

const onSubmit = form.handleSubmit(values => {
  if (!lockView.value) return
  const endTime = Math.floor(new Date(values.unlockDate).getTime() / 1000)
  const current = Number(lockView.value.endTime)
  if (endTime <= current) return

  const lockerAddr = lockerAddress.value as `0x${string}`
  if (!lockerAddr)
    throw new Error('Locker contract address is not configured for this network')

  writeContractFn({
    address: lockerAddr,
    abi: ERC20_LOCKER_ABI,
    functionName: 'extendLock',
    args: [lockId.value, BigInt(endTime)] as const
  })
})
</script>
