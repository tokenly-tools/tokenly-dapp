<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { useVModel } from '@vueuse/core'
import type { DateValue } from '@internationalized/date'
import {
  DateFormatter,
  getLocalTimeZone,
  Time,
  parseAbsoluteToLocal,
  today
} from '@internationalized/date'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon, Clock } from 'lucide-vue-next'
import { TimeFieldInput, TimeFieldRoot } from 'reka-ui'

// Time field: use Reka UI TimeField for accessible segmented input

defineOptions({ inheritAttrs: false })

const props = defineProps<{
  modelValue?: string | null
  class?: HTMLAttributes['class']
}>()

const emits = defineEmits<{
  (e: 'update:modelValue', value: string | null): void
}>()

const model = useVModel(props, 'modelValue', emits, { passive: true })

const df = new DateFormatter('en-US', { dateStyle: 'long' })

// Internal pieces
const dateValue = ref<DateValue | undefined>()
const timeValue = ref<Time | undefined>()

// Min constraints: block past dates and past time on today
const minDate = today(getLocalTimeZone())
function isSameDay(a?: DateValue, b?: DateValue) {
  if (!a || !b) return false
  return a.year === b.year && a.month === b.month && a.day === b.day
}
const minTime = computed<Time>(() => {
  // If selected date is today, min time is now; otherwise 00:00
  if (isSameDay(dateValue.value, minDate)) {
    const now = new Date()
    return new Time(now.getHours(), now.getMinutes())
  }
  return new Time(0, 0)
})

// Initialize from incoming model (ISO or datetime string)
watchEffect(() => {
  const iso = model.value
  if (!iso) return
  try {
    const zdt = parseAbsoluteToLocal(iso)
    // Split into date and time values that Calendar/TimeField understand
    dateValue.value = zdt
    timeValue.value = new Time(zdt.hour, zdt.minute)
  } catch {
    // ignore invalid
  }
})

function commitCombined() {
  if (!dateValue.value || !timeValue.value) return
  // Clamp time if selecting today and time is before now
  if (isSameDay(dateValue.value, minDate)) {
    const mt = minTime.value
    const t = timeValue.value
    const isBefore = t.hour < mt.hour || (t.hour === mt.hour && t.minute < mt.minute)
    if (isBefore) {
      timeValue.value = new Time(mt.hour, mt.minute)
    }
  }
  const js = dateValue.value.toDate(getLocalTimeZone())
  js.setHours(timeValue.value.hour || 0, timeValue.value.minute || 0, 0, 0)
  model.value = js.toISOString()
}

watch([dateValue, timeValue], commitCombined)
</script>

<template>
  <div :class="cn('flex w-full items-center gap-2', props.class)" v-bind="$attrs">
    <!-- Date selector (shadcn) -->
    <Popover>
      <PopoverTrigger as-child>
        <Button
          variant="outline"
          :class="
            cn(
              'justify-start text-left font-normal',
              // Make calendar trigger look like inputs (not rounded-full)
              'dark:bg-input/30 border-input shadow-xs focus-visible:border-ring focus-visible:ring-ring/50 rounded-md bg-orange-50 focus-visible:ring-[3px]',
              'w-[240px]'
            )
          "
        >
          <CalendarIcon class="mr-2 h-4 w-4" />
          <span>
            {{
              dateValue ? df.format(dateValue.toDate(getLocalTimeZone())) : 'Pick a date'
            }}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent side="bottom" align="start" class="w-auto p-0">
        <Calendar v-model="dateValue" initial-focus />
      </PopoverContent>
    </Popover>

    <!-- Time selector (Reka UI, segmented pattern) -->
    <div class="flex items-center gap-2">
      <Clock class="text-muted-foreground h-4 w-4" />
      <TimeFieldRoot
        v-model="timeValue"
        v-slot="{ segments }"
        :granularity="'minute'"
        :hour-cycle="24"
        :hide-time-zone="true"
        locale="en-GB"
        :placeholder="new Time(0, 0)"
        class="dark:bg-input/30 border-input shadow-xs focus-within:border-ring focus-within:ring-ring/50 inline-flex h-9 select-none items-center gap-1 rounded-md border bg-orange-50 px-3 text-sm transition-[color,box-shadow] focus-within:ring-[3px]"
      >
        <template v-for="seg in segments" :key="seg.part">
          <TimeFieldInput v-if="seg.part === 'literal'" :part="seg.part">
            {{ seg.value }}
          </TimeFieldInput>
          <TimeFieldInput
            v-else
            :part="seg.part"
            class="focus-visible:ring-ring/50 rounded px-0.5 text-center outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0"
          >
            {{ seg.value }}
          </TimeFieldInput>
        </template>
      </TimeFieldRoot>
    </div>
  </div>
</template>
