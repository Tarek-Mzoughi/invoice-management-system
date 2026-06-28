module.exports = {
  extends: ['next/core-web-vitals'],
  ignorePatterns: [
    'node_modules/**',
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    'public/static/**/*.js'
  ],
  overrides: [
    {
      files: [
        'src/pages/buying/**/*.{ts,tsx}',
        'src/features/buying/**/*.{ts,tsx}',
        'src/components/buying/**/*.{ts,tsx}'
      ],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            patterns: [
              {
                group: ['@/components/selling/**', '@/features/selling/**'],
                message:
                  'Buying UI must stay independent. Move shared code to features/invoicing/shared instead.'
              }
            ]
          }
        ]
      }
    },
    {
      files: ['src/features/invoicing/**/*.{ts,tsx}'],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            patterns: [
              {
                group: ['@/components/selling/**', '@/features/selling/**'],
                message:
                  'features/invoicing/shared must be neutral and cannot depend on selling modules.'
              }
            ]
          }
        ]
      }
    }
  ]
};
