<template>
  <component
    :is="to || href ? NuxtLink : 'div'"
    :to="to"
    :href="href"
    :target="href ? '_blank' : '_self'"
    class="card group flex min-h-[200px] cursor-pointer flex-col justify-between rounded-2xl p-6"
    :class="colorMap[color].bgCardColor"
  >
    <div
      class="relative mb-2 flex w-max items-center gap-2 overflow-hidden rounded-full px-4 py-2 text-sm font-medium"
      :class="colorMap[color].bgBadgeColor"
    >
      <div
        class="flex items-center gap-2 transition-transform duration-300 group-hover:-translate-x-6"
      >
        <component
          :is="icon"
          :size="20"
          class="transition-opacity duration-300 group-hover:opacity-0"
        />
        <span>{{ title }}</span>
      </div>
      <ArrowRight
        class="absolute right-2 translate-x-full opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100"
        :size="20"
      />
    </div>
    <div class="text-2xl font-medium">{{ description }}</div>
  </component>
</template>
<script setup lang="ts">
import { ArrowRight } from 'lucide-vue-next'
import { NuxtLink } from '#components'

defineProps<{
  title: string
  icon: Component
  description: string
  color: keyof typeof colorMap
  to?: object | string
  href?: string
}>()

const colorMap = {
  blue: {
    bgCardColor: 'bg-blue-200',
    bgBadgeColor: 'bg-blue-300'
  },
  green: {
    bgCardColor: 'bg-green-200',
    bgBadgeColor: 'bg-green-300'
  },
  rose: {
    bgCardColor: 'bg-rose-200',
    bgBadgeColor: 'bg-rose-300'
  },
  teal: {
    bgCardColor: 'bg-teal-200',
    bgBadgeColor: 'bg-teal-300'
  },
  orange: {
    bgCardColor: 'bg-orange-200',
    bgBadgeColor: 'bg-orange-300'
  },
  amber: {
    bgCardColor: 'bg-amber-200',
    bgBadgeColor: 'bg-amber-300'
  },
  yellow: {
    bgCardColor: 'bg-yellow-200',
    bgBadgeColor: 'bg-yellow-300'
  },
  indigo: {
    bgCardColor: 'bg-indigo-200',
    bgBadgeColor: 'bg-indigo-300'
  }
}
</script>
