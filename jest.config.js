module.exports = {
  globals: {
    YUP_USE_SYNC: true,
  },
  // testEnvironment: 'node',
  setupTestFrameworkScriptFile: '<rootDir>/src/config/jest/setupFramework.ts',
  roots: ['test'],
  testMatch: ['<rootDir>/test/**/?(*.)test.ts*'],
  testPathIgnorePatterns: ['helpers\\/*\\.ts'],
  transform: {
    '^.+\\.(j|t)sx?$': 'ts-jest',
  },

  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'], // mjs causes transform issues

  moduleNameMapper: {
    'yup(.*)': '<rootDir>/src/$1',
  },
}
