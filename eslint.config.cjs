const js = require('@eslint/js')
const vuePlugin = require('eslint-plugin-vue')
const prettier = require('eslint-config-prettier')
const vueParser = require('vue-eslint-parser')

module.exports = {
  // Ignore backup files that are kept in the repo; ESLint v8+ expects "ignores" here
  ignores: ['**/*.bak.*', 'src/components/*.bak.vue'],
  overrides: [
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
          document: 'readonly',
          Blob: 'readonly',
          URL: 'readonly',
          navigator: 'readonly',
          ClipboardItem: 'readonly',
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
    {
      // Node/server scripts override
      files: ['server/**/*.js', 'server/**/*.cjs'],
      languageOptions: {
        env: { node: true },
        parserOptions: {
          ecmaVersion: 2020,
          sourceType: 'script'
        },
        globals: {
          require: 'readonly',
          module: 'readonly',
          process: 'readonly',
          console: 'readonly',
          Buffer: 'readonly',
          __dirname: 'readonly'
        }
      },
      rules: {
        // allow unused variables in quick scripts, adjust later if needed
        'no-unused-vars': ['warn', { args: 'none', varsIgnorePattern: '^_' }]
      }
    },
    prettier
  ]
}
