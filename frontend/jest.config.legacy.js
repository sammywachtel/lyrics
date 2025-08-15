/**
 * Temporary Jest configuration for legacy tests during migration
 * This runs the tests from their original locations until import paths are fixed
 */
export default {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/utils/setupTests.ts'],

  // Memory optimization settings
  maxWorkers: 1, // Use single worker to reduce memory usage
  workerIdleMemoryLimit: '1GB',
  logHeapUsage: true,

  // Limit concurrent tests to prevent memory overload
  maxConcurrency: 1,
  forceExit: true,
  detectOpenHandles: true,

  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(gif|ttf|eot|svg|png)$': '<rootDir>/tests/__mocks__/fileMock.js',
    '^../lib/api$': '<rootDir>/tests/__mocks__/api.ts'
  },

  // Transform ES modules in node_modules
  transformIgnorePatterns: [
    'node_modules/(?!(isows|@supabase)/)'
  ],
  preset: 'ts-jest/presets/default-esm',
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      useESM: true,
      tsconfig: {
        jsx: 'react-jsx',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true
      }
    }]
  },

  // Run tests from original locations during migration
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.(ts|tsx|js)',
    '<rootDir>/src/**/?(*.)(spec|test).(ts|tsx|js)',
    // Also include the properly organized tests
    '<rootDir>/tests/unit/utils/**/*.(test|spec).(ts|tsx|js)'
  ],

  collectCoverageFrom: [
    'src/**/*.(ts|tsx)',
    '!src/**/*.d.ts',
    '!src/main.tsx',
    '!tests/**/*'
  ],
  coverageReporters: ['text', 'lcov', 'html'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node']
}
