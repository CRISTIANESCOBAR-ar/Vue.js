module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true
  },
  extends: ['eslint:recommended'],
  rules: {
    // project-wide rules can go here
  },
  overrides: [
    {
      files: ['scripts/**', 'scripts/*.cjs', 'scripts/*.js'],
      env: { node: true },
      parserOptions: { sourceType: 'script' },
      rules: {
        'no-undef': 'off'
      }
    },
    {
      files: ['tests/**', 'tests/**/*.js'],
      env: { node: true, browser: true },
      globals: {
        localStorage: 'readonly'
      },
      rules: {
        'no-undef': 'off'
      }
    },
    {
      files: ['**/*.cjs'],
      env: { node: true },
      parserOptions: { sourceType: 'script' }
    }
  ]
}
