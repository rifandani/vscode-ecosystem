// @ts-check
const antfu = require('@antfu/eslint-config').default

module.exports = antfu(
  {
    ignores: [
      // eslint ignore globs here
      'webview-ui/build/*',
      'webview-ui/src/presets/*',
    ],
  },
  {
    rules: {
      // overrides
    },
  },
)
