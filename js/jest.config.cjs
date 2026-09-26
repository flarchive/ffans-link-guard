module.exports = require('@flarum/jest-config')({
  modulePaths: ['<rootDir>/node_modules'],
  moduleNameMapper: {
    '^@flarum/core/src/(.*)$': '<rootDir>/../vendor/flarum/core/js/src/$1',
    '^flarum/(.*)$': '<rootDir>/../vendor/flarum/core/js/src/$1',
  },
  transform: {
    '^.+\\.[tj]sx?$': ['babel-jest', require('flarum-webpack-config/babel.config.cjs')],
  },
  transformIgnorePatterns: ['/node_modules/(?!@flarum/jest-config/)'],
});
