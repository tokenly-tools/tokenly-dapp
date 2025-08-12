import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'
import { dirname, resolve as resolvePath } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  devtools: { enabled: true },
  css: ['@/assets/css/main.css'],
  modules: ['nitro-cloudflare-dev', 'shadcn-nuxt', '@nuxt/eslint', 'vue-sonner/nuxt'],
  vite: {
    plugins: [tailwindcss()]
  },
  nitro: {
    preset: 'cloudflare_module',
    cloudflare: {
      deployConfig: true,
      nodeCompat: true
    },
    moduleSideEffects: ['@prisma/client/edge'],
    externals: {
      inline: ['@prisma/client', '@prisma/client/edge', '.prisma/client']
    },
    alias: {
      'pino-pretty': resolvePath(__dirname, 'server/stubs/empty.ts')
    }
  },
  shadcn: {
    prefix: '',
    componentDir: './components/ui'
  },
  imports: {
    dirs: ['@/ts/*.d.ts']
  },
  runtimeConfig: {
    public: {
      coreMainnet: {
        factoryAddress: '',
        multisenderAddress: '',
        lockerAddress: '',
        lockerReaderAddress: ''
      },
      coreTestnet2: {
        factoryAddress: '',
        multisenderAddress: '',
        lockerAddress: '',
        lockerReaderAddress: ''
      }
    }
  }
})
