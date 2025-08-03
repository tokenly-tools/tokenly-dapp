<template>
  <div class="mx-auto max-w-2xl">
    <h1 class="mb-6 text-2xl font-bold">Mint New Token</h1>
    <div class="rounded-2xl bg-orange-100 p-6">
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
            {{ isSubmitting ? 'Minting...' : 'Mint Token' }}
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

const isSubmitting = ref(false)

const isBtnDisabled = computed(() => {
  return isSubmitting.value || !form.meta.value.valid || !form.meta.value.dirty
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
  isSubmitting.value = true

  try {
    console.log('Form submitted with values:', values)
    await new Promise(resolve => setTimeout(resolve, 2000)) // Simulate API call

    alert('Token minted successfully!')
  } catch (error) {
    console.error('Error minting token:', error)
    alert('Failed to mint token. Please try again.')
  } finally {
    isSubmitting.value = false
  }
})
</script>
