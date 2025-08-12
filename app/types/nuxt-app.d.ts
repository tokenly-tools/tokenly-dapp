declare module '@/components/ui/datetime' {
  import type { DefineComponent } from 'vue'
  export const DateTimePicker: DefineComponent<any, any, any>
}

import type { NuxtApp } from '#app'

declare module '#app' {
  interface NuxtApp {
    $toast: {
      info: (message: string, options?: Record<string, unknown>) => string | number
      success: (message: string, options?: Record<string, unknown>) => string | number
      error: (message: string, options?: Record<string, unknown>) => string | number
      dismiss: (id?: string | number) => void
    }
  }
}

declare module 'vue' {
  interface ComponentCustomProperties {
    $toast: NuxtApp['$toast']
  }
}

export {}
