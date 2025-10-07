import js from '@eslint/js'

export default [
  { ignores: ['coverage', 'dist'] },
  {
    languageOptions: {
      ecmaVersion: 'latest',
      globals: {
        console: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        should: 'readonly'
      },
      sourceType: 'module'
    }
  },
  js.configs.recommended
]
