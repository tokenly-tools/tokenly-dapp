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
    </div>
  </div>
</template>

<script setup lang="ts">
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { parseEther } from 'viem'
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
  isConnected,
  connectedAddress
} = useContractTransaction({
  successMessage: 'Token minted successfully!',
  errorMessage: 'Failed to mint token. Please try again.',
  pendingMessage: 'Minting your token...',
  onSuccess: () => form.resetForm()
})

const isBtnDisabled = computed(() => {
  return (
    isMinting.value ||
    !form.meta.value.valid ||
    !form.meta.value.dirty ||
    !isConnected.value
  )
})

const onSubmit = form.handleSubmit(async values => {
  writeContractFn({
    address: useRuntimeConfig().public.factoryAddress as `0x${string}`,
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
</script>
