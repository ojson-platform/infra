import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import importPlugin from 'eslint-plugin-import';
import prettier from 'eslint-config-prettier';
import { existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Auto-detects if the current directory contains with-* module patterns
 * @param {string} baseDir - Directory to check (defaults to CWD of config)
 * @returns {boolean} True if with-* modules detected
 */
function hasWithModules(baseDir = process.cwd()) {
  try {
    const srcDir = join(baseDir, 'src');
    if (!existsSync(srcDir)) return false;
    
    // Check for with-* directories in src
    const entries = readdirSync(srcDir, { withFileTypes: true });
    return entries.some(entry => 
      entry.isDirectory() && entry.name.startsWith('with-')
    );
  } catch {
    return false;
  }
}

/**
 * Creates base configuration that all packages use
 * @param {Object} options - Configuration options
 * @param {boolean} options.withRestrictions - Apply with-* module restrictions
 * @returns {Array} ESLint configuration objects
 */
function createConfig(options = {}) {
  const { withRestrictions = false } = options;
  
  const baseConfig = [
    js.configs.recommended,
    
    {
      name: '@ojson/infra/typescript-base',
      files: ['src/**/*.ts'],
      ignores: ['**/*.spec.ts'],
      languageOptions: {
        parser: typescriptParser,
        parserOptions: {
          ecmaVersion: 2020,
          sourceType: 'module',
          project: './tsconfig.json',
        },
        globals: {
          setTimeout: 'readonly',
          clearTimeout: 'readonly',
          setInterval: 'readonly',
          clearInterval: 'readonly',
          console: 'readonly',
          Buffer: 'readonly',
          process: 'readonly',
        },
      },
      plugins: {
        '@typescript-eslint': typescript,
        import: importPlugin,
      },
      rules: {
        ...typescript.configs.recommended.rules,
        '@typescript-eslint/no-unused-vars': [
          'error',
          {
            argsIgnorePattern: '^_',
            varsIgnorePattern: '^_',
          },
        ],
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/no-explicit-any': 'warn',
        '@typescript-eslint/no-unsafe-function-type': 'off',
        'import/order': [
          'error',
          {
            groups: ['type', 'builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
            'newlines-between': 'always',
            alphabetize: {
              order: 'asc',
              caseInsensitive: true,
            },
          },
        ],
        'import/no-unresolved': 'off',
      },
    },
    
    {
      name: '@ojson/infra/test-files',
      files: ['src/**/*.spec.ts'],
      languageOptions: {
        parser: typescriptParser,
        parserOptions: {
          ecmaVersion: 2020,
          sourceType: 'module',
        },
        globals: {
          setTimeout: 'readonly',
          clearTimeout: 'readonly',
          setInterval: 'readonly',
          clearInterval: 'readonly',
          console: 'readonly',
          Buffer: 'readonly',
          process: 'readonly',
        },
      },
      plugins: {
        '@typescript-eslint': typescript,
      },
      rules: {
        ...typescript.configs.recommended.rules,
        '@typescript-eslint/no-unused-vars': [
          'error',
          {
            argsIgnorePattern: '^_',
            varsIgnorePattern: '^_',
          },
        ],
        '@typescript-eslint/no-explicit-any': 'off',
        'no-undef': 'off',
      },
    },
    
    prettier,
    
    {
      name: '@ojson/infra/global-ignores',
      ignores: [
        'build/',
        'node_modules/',
        'dist/',
        '*.config.js',
        '*.config.ts',
        '*.config.mjs',
        'scripts/',
      ],
    },
  ];
  
  // Add with-module restrictions if requested
  if (withRestrictions) {
    baseConfig.splice(3, 0, {
      name: '@ojson/infra/with-module-restrictions',
      files: ['src/**/*.ts'],
      ignores: ['**/*.spec.ts'],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            patterns: [
              {
                group: [
                  '../with-*/**/*',
                  '!../with-*',
                ],
                message: 'Import from module root instead of internal module files',
              },
            ],
          },
        ],
      },
    });
  }
  
  return baseConfig;
}

// Auto-detect with-* modules for default export
const withModulesDetected = hasWithModules();

// Default export with auto-detection
export default createConfig({ withRestrictions: withModulesDetected });

// Named exports for explicit control
export { createConfig, hasWithModules };

// Export pre-configured variants
export const base = createConfig({ withRestrictions: false });
export const withRestrictions = createConfig({ withRestrictions: true });
