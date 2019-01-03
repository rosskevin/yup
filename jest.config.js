module.exports = {
  globals: {
    YUP_USE_SYNC: true,
  },
  // testEnvironment: 'node',
  setupTestFrameworkScriptFile: '<rootDir>/src/config/jest/setupFramework.ts',
  roots: ['test'],
  // testRegex: '\\.js',
  // testMatch: ['<rootDir>/src/**/?(*.)test.ts?(x)'],
  testMatch: ['<rootDir>/test/**/?(*.)test.ts', '<rootDir>/test/**/?(*.)test.js'],
  testPathIgnorePatterns: ['helpers\\.js'],
  transform: {
    // '^.+\\.tsx?$': 'ts-jest',
    '^.+\\.(j|t)sx?$': 'ts-jest',
    // '^.+\\.js$': 'babel-jest',
  },

  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'], // mjs causes transform issues
}
