module.exports = require('@flarum/jest-config')({
  modulePaths: ['<rootDir>/node_modules'],
  // The 1.x preset boots Core's own test app and reads locale/core.yml.
  // Extension suites provide their app fixtures and use the real Core modules.
  setupFilesAfterEnv: ['<rootDir>/test-utils/setup.ts'],
  moduleNameMapper: {
    '^@flarum/core/src/(.*)$': '<rootDir>/../vendor/flarum/core/js/src/$1',
    '^flarum/(.*)$': '<rootDir>/../vendor/flarum/core/js/src/$1',
  },
  transform: {
    '^.+\\.[tj]sx?$': ['babel-jest', require('flarum-webpack-config/babel.config.js')],
  },
  transformIgnorePatterns: ['/node_modules/(?!@flarum/jest-config/)'],
});
