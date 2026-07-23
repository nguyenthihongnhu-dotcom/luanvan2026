import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      // Project convention is fetch-on-mount via useEffect + setState in an
      // async loader (see frontend/README.md "Quy tắc code frontend"), not
      // the React Compiler-oriented effect-purity model this rule assumes.
      // Downgrade to warn instead of mass-rewriting ~14 pages that all use
      // this same, intentional shape.
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
])
