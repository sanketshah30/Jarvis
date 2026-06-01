module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/e2e/**/*.spec.js'],
  testTimeout: 60000,
  verbose: true,
  collectCoverageFrom: [
    'tests/e2e/**/*.js',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/tests/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
};
