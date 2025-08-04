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
                <Input type="text" placeholder="Enter token name" v-bind="componentField" />
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>

          <FormField v-slot="{ componentField }" name="tokenSymbol">
            <FormItem>
              <FormLabel>Token Symbol</FormLabel>
              <FormControl>
                <Input type="text" placeholder="Enter token symbol" v-bind="componentField" />
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>

          <FormField v-slot="{ componentField }" name="totalSupply">
            <FormItem>
              <FormLabel>Total Supply</FormLabel>
              <FormControl>
                <Input type="text" placeholder="Enter total supply" v-bind="componentField" />
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>

          <Button type="submit" class="w-full" :disabled="isBtnDisabled">
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
import * as z from 'zod'

import { Button } from '@/components/ui/button'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'

// Use the mint token hook
const { mintToken, isMinting, isSuccess, hasError, getErrorMessage, transactionHash, connectedAddress, isConnected } =
  useMintToken()

const isBtnDisabled = computed(() => {
  return isMinting.value || !form.meta.value.valid || !form.meta.value.dirty || !isConnected.value
})

const formSchema = toTypedSchema(
  z.object({
    tokenName: z
      .string()
      .min(2, 'Token name must be at least 2 characters')
      .max(50, 'Token name must be less than 50 characters'),
    tokenSymbol: z
      .string()
      .min(2, 'Token symbol must be at least 2 characters')
      .max(10, 'Token symbol must be less than 10 characters')
      .regex(/^[A-Z]+$/, 'Token symbol must be uppercase letters only'),
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

const onSubmit = form.handleSubmit(async values => {
  try {
    // Check wallet connection
    if (!isConnected.value) {
      alert('Please connect your wallet first')
      return
    }

    console.log('Form submitted with values:', values)
    console.log('Connected wallet:', connectedAddress.value)

    // Call the mint token function
    const result = await mintToken({
      tokenName: values.tokenName,
      tokenSymbol: values.tokenSymbol,
      totalSupply: values.totalSupply
    })

    if (result.error) {
      alert(`Failed to mint token: ${result.error}`)
    } else {
      console.log('Transaction hash:', result.transactionHash)
      // Don't show success immediately - wait for transaction confirmation
    }
  } catch (error) {
    console.error('Error minting token:', error)
    alert('Failed to mint token. Please try again.')
  }
})

// Watch for successful transaction confirmation
watch(isSuccess, newSuccess => {
  if (newSuccess && transactionHash.value) {
    alert(`Token minted successfully! Transaction: ${transactionHash.value}`)
    form.resetForm() // Reset the form after successful mint
  }
})

// Watch for errors
watch(hasError, newHasError => {
  if (newHasError) {
    const errorMessage = getErrorMessage()
    if (errorMessage) {
      alert(`Error: ${errorMessage}`)
    }
  }
})
</script>
