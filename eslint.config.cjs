const js = require('@eslint/js')
const vuePlugin = require('eslint-plugin-vue')
const prettier = require('eslint-config-prettier')
const vueParser = require('vue-eslint-parser')

module.exports = [
  js.configs.recommended,
  {
    files: ['**/*.vue'],
    plugins: {
      vue: vuePlugin
    },
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module'
      },
      globals: {
        window: 'readonly',
        localStorage: 'readonly',
        console: 'readonly',
        fetch: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        Swal: 'readonly'
      }
    },
    rules: {
      'vue/html-indent': ['warn', 2],
      'vue/max-attributes-per-line': ['warn', { singleline: 3 }],
      'vue/multi-word-component-names': 'off',
      'vue/no-unused-vars': 'warn',
      'vue/no-mutating-props': 'warn'
    }
  },
  prettier
]
