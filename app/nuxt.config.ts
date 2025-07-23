import tailwindcss from '@tailwindcss/vite';

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  modules: ['nitro-cloudflare-dev', 'shadcn-nuxt'],
  vite: {
    plugins: [tailwindcss()],
  },
  nitro: {
    preset: 'cloudflare_pages',
    modules: ['nitro-cloudflare-dev'],
    cloudflare: {
      deployConfig: true,
      nodeCompat: true,
    },
  },
  shadcn: {
    prefix: '',
    componentDir: './components/ui'
  }
});