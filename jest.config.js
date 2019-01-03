module.exports = {
  globals: {
    YUP_USE_SYNC: true,
  },
  testEnvironment: 'node',
  setupTestFrameworkScriptFile: './test-setup.js',
  roots: ['test'],
  testRegex: '\\.js',
  testPathIgnorePatterns: ['helpers\\.js'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
    // '^.+\\.(j|t)sx?$': 'ts-jest',
    '^.+\\.js$': 'babel-jest',
  },
}
