// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt({
  files: ['*.vue'],
  parser: 'vue-eslint-parser',
  parserOptions: {
    parser: '@typescript-eslint/parser',
    ecmaVersion: 2020,
    sourceType: 'module'
  }
})
// Your custom configs here
