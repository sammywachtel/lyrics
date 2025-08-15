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
  testMatch: [
    // Run all unit and integration tests in the centralized location
    '<rootDir>/tests/unit/**/*.(test|spec).(ts|tsx|js)',
    '<rootDir>/tests/integration/**/*.(test|spec).(ts|tsx|js)'
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
