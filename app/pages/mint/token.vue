<template>
  <div class="mx-auto mt-4 max-w-2xl md:mt-0">
    <h1 class="mb-6 text-2xl font-bold">Mint New Token</h1>
    <div>
      <form @submit="onSubmit">
        <div class="space-y-4">
          <FormField v-slot="{ componentField }" name="tokenName">
            <FormItem>
              <FormLabel>Token Name</FormLabel>
              <FormControl>
                <Input
                  type="text"
                  placeholder="Enter token name"
                  v-bind="componentField"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>

          <FormField v-slot="{ componentField }" name="tokenSymbol">
            <FormItem>
              <FormLabel>Token Symbol</FormLabel>
              <FormControl>
                <Input
                  type="text"
                  placeholder="Enter token symbol"
                  v-bind="componentField"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>

          <FormField v-slot="{ componentField }" name="totalSupply">
            <FormItem>
              <FormLabel>Total Supply</FormLabel>
              <FormControl>
                <Input
                  type="text"
                  placeholder="Enter total supply"
                  v-bind="componentField"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>

          <Button type="submit" class="w-full" :disabled="isBtnDisabled" require-wallet>
            {{ isMinting ? 'Minting...' : 'Mint Token' }}
          </Button>
        </div>
      </form>
      <div
        v-if="mintedTokenAddress"
        class="mt-6 flex rounded-lg border border-teal-200 bg-teal-50 px-2 py-4 text-teal-900"
      >
        <div class="mr-2 font-semibold">🎉 Fresh mint! What's next!?</div>
        <div class="mx-2 flex gap-4">
          <NuxtLink
            :to="`/locks?token=${mintedTokenAddress}`"
            class="flex items-center hover:underline"
            ><Lock class="mr-1" :size="16" /> Lock it in!</NuxtLink
          >
          <NuxtLink
            :to="`/multisender?token=${mintedTokenAddress}`"
            class="flex items-center hover:underline"
            ><Send class="mr-1" :size="16" /> Multisend it!</NuxtLink
          >
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Lock, Send } from 'lucide-vue-next'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { parseEther, decodeEventLog } from 'viem'
import * as z from 'zod'
import { ERC20_TOKEN_FACTORY_ABI } from '@/abis/allAbis'

const formSchema = toTypedSchema(
  z.object({
    tokenName: z
      .string()
      .min(2, 'Token name must be at least 2 characters')
      .max(50, 'Token name must be less than 50 characters')
      .refine(value => value.trim().length > 0, 'Token name cannot be whitespace only'),
    tokenSymbol: z
      .string()
      .min(2, 'Token symbol must be at least 2 characters')
      .max(10, 'Token symbol must be less than 10 characters')
      .regex(/^[A-Z]+$/, 'Token symbol must be uppercase letters only')
      .refine(value => value.trim().length > 0, 'Token symbol cannot be whitespace only'),
    totalSupply: z
      .string()
      .min(1, 'Total supply is required')
      .refine(value => {
        const num = Number(value)
        return !isNaN(num) && num > 0
      }, 'Total supply must be greater than 0')
  })
)

const form = useForm({
  validationSchema: formSchema,
  initialValues: {
    tokenName: '',
    tokenSymbol: '',
    totalSupply: ''
  }
})

const {
  isPending: isMinting,
  writeContract: writeContractFn,
  connectedAddress,
  hash
} = useContractTransaction({
  successMessage: 'Token minted successfully!',
  errorMessage: 'Failed to mint token. Please try again.',
  pendingMessage: 'Minting your token...',
  onSuccess: () => form.resetForm()
})

const { get: getAddress } = useAddresses()
const factoryAddress = computed(() => getAddress('factoryAddress') as `0x${string}`)

const isBtnDisabled = computed(() => {
  return isMinting.value || (!form.meta.value.pending && !form.meta.value.valid)
})

const onSubmit = form.handleSubmit(async values => {
  writeContractFn({
    address: factoryAddress.value,
    abi: ERC20_TOKEN_FACTORY_ABI,
    functionName: 'createToken',
    args: [
      values.tokenName.trim(),
      values.tokenSymbol.trim(),
      connectedAddress.value!,
      parseEther(values.totalSupply)
    ] as const
  })
})

const { waitForTransactionReceipt } = useWagmiClient()
const receipt = waitForTransactionReceipt({ hash })
const router = useRouter()
const mintedTokenAddress = ref<`0x${string}` | null>(null)

watch(
  () => receipt.isSuccess.value,
  ok => {
    if (!ok || mintedTokenAddress.value) return
    const data: any = receipt.data?.value as any
    if (!data) return
    try {
      for (const log of data.logs ?? []) {
        try {
          const decoded = decodeEventLog({
            abi: ERC20_TOKEN_FACTORY_ABI,
            data: log.data,
            topics: log.topics
          })
          if (decoded.eventName === 'TokenCreated') {
            const tokenAddress = decoded.args.tokenAddress as `0x${string}`
            mintedTokenAddress.value = tokenAddress
            break
          }
        } catch {
          // ignore non-matching logs
        }
      }
    } catch {
      // ignore decode errors
    }
  },
  { immediate: false }
)

const goToLocker = () => {
  if (!mintedTokenAddress.value) return
  router.push({ path: '/locks', query: { token: mintedTokenAddress.value } })
}
const goToMultisender = () => {
  if (!mintedTokenAddress.value) return
  router.push({ path: '/multisender', query: { token: mintedTokenAddress.value } })
}
</script>
