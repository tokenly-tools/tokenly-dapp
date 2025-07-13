// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  devtools: { enabled: true },
  modules: ['nitro-cloudflare-dev'],
  nitro: {
    preset: 'cloudflare_pages',
    modules: ['nitro-cloudflare-dev'],
    cloudflare: {
      deployConfig: true,
      nodeCompat: true,
    },
  },
});
