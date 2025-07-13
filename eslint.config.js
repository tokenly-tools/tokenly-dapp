import { createConfigForNuxt } from '@nuxt/eslint-config/flat'

export default createConfigForNuxt({
  // Options here will be passed to the config generator
  features: {
    // Disable stylistic rules if using Prettier
    stylistic: false,
  },
}).append({
  rules: {
    // Add any custom rules here
    'no-console': 'warn',
    'no-unused-vars': 'warn',
    'prefer-const': 'error',
  },
}) 