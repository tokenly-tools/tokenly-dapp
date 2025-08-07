<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { Primitive, type PrimitiveProps } from 'reka-ui'
import { cn } from '@/lib/utils'
import { type ButtonVariants, buttonVariants } from '.'

interface Props extends PrimitiveProps {
  variant?: ButtonVariants['variant']
  size?: ButtonVariants['size']
  class?: HTMLAttributes['class']
  requireWallet?: boolean
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  as: 'button',
  requireWallet: false,
  disabled: false
})

const { openConnectModal, isConnected } = useWagmiClient()

const emit = defineEmits<{
  click: [event: Event]
}>()

const handleClick = (event: Event) => {
  if (props.requireWallet && !isConnected.value) {
    event.preventDefault()
    event.stopPropagation()
    openConnectModal()
    return
  }
  emit('click', event)
}

const shouldBeDisabled = computed(() => {
  if (props.requireWallet && !isConnected.value) {
    return false
  }
  return props.disabled
})
</script>

<template>
  <Primitive
    data-slot="button"
    :as="as"
    :as-child="asChild"
    :class="cn(buttonVariants({ variant, size }), props.class)"
    :disabled="shouldBeDisabled"
    @click="handleClick"
  >
    <slot v-if="!requireWallet || isConnected" />
    <span v-else>Connect Wallet</span>
  </Primitive>
</template>
